import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createInvite, deleteInvite, findUserByEmail, listOpenInvites, listUsers, setUserActive, updateUserRole } from '$lib/server/auth';
import { ROLES, type Role } from '$lib/server/db/schema';
import { int, str } from '$lib/server/forms';
import { inviteText } from '$lib/server/invite-text';
import { requireRole } from '$lib/server/permissions';

export const load: PageServerLoad = ({ locals }) => {
	requireRole(locals.user, 'users.manage');
	return {
		users: listUsers(locals.db).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active })),
		invites: listOpenInvites(locals.db).map((i) => ({ id: i.id, name: i.name, email: i.email, role: i.role, expiresAt: i.expiresAt, token: i.token }))
	};
};

const isRole = (r: string): r is Role => (ROLES as readonly string[]).includes(r);

export const actions: Actions = {
	invite: async ({ request, locals, url }) => {
		requireRole(locals.user, 'users.manage');
		const fd = await request.formData();
		const name = str(fd, 'name');
		const email = str(fd, 'email');
		const role = str(fd, 'role');
		if (!name || !email.includes('@') || !isRole(role)) return fail(400, { error: 'Bitte Name, gültige E-Mail und Rolle angeben.' });
		if (findUserByEmail(locals.db, email)) return fail(400, { error: 'Für diese E-Mail gibt es schon ein Konto.' });
		const inv = createInvite(locals.db, { name, email, role, createdBy: locals.user!.id });
		const link = `${url.origin}/einladung/${inv.token}`;
		return { invited: { link, text: inviteText(name, link) } };
	},
	setRole: async ({ request, locals }) => {
		requireRole(locals.user, 'users.manage');
		const fd = await request.formData();
		const id = int(fd, 'id');
		const role = str(fd, 'role');
		if (id === locals.user!.id) return fail(400, { error: 'Die eigene Rolle kann nicht geändert werden.' });
		if (!isRole(role)) return fail(400, { error: 'Ungültige Rolle.' });
		updateUserRole(locals.db, id, role);
		return { ok: true };
	},
	setActive: async ({ request, locals }) => {
		requireRole(locals.user, 'users.manage');
		const fd = await request.formData();
		const id = int(fd, 'id');
		const active = str(fd, 'active') === '1';
		if (id === locals.user!.id) return fail(400, { error: 'Das eigene Konto kann nicht deaktiviert werden.' });
		setUserActive(locals.db, id, active);
		return { ok: true };
	},
	deleteInvite: async ({ request, locals }) => {
		requireRole(locals.user, 'users.manage');
		const fd = await request.formData();
		deleteInvite(locals.db, int(fd, 'id'));
		return { ok: true };
	}
};
