import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { todayIso } from '$lib/dates';
import { BISHOPRIC_ROLES, BISHOPRIC_ROLE_LABELS, getBishopric, setBishopricMember, type BishopricRole } from '$lib/server/bishopric';
import { int, optInt, str } from '$lib/server/forms';
import { displayName, getMember, listMembers } from '$lib/server/members';
import { requireRole } from '$lib/server/permissions';
import { memberOptions } from '$lib/server/picker';
import { getAllSettings, setSetting } from '$lib/server/settings';
import { ensureSundays } from '$lib/server/meetings';
import { createStakeCalling, deleteStakeCalling, listStakeCallings, moveStakeCalling, renameStakeCalling, setStakeCallingPresides } from '$lib/server/stake-callings';

const isBishopricRole = (r: string): r is BishopricRole => (BISHOPRIC_ROLES as readonly string[]).includes(r);

export const load: PageServerLoad = ({ locals }) => {
	requireRole(locals.user, 'settings.edit');
	const all = listMembers(locals.db);
	const entries = getBishopric(locals.db);
	const candidates = memberOptions(all.filter((m) => m.kind === 'gemeinde'), new Map(), 'plain', todayIso());
	return {
		settings: getAllSettings(locals.db),
		bishopric: BISHOPRIC_ROLES.map((role) => ({ role, label: BISHOPRIC_ROLE_LABELS[role], memberId: entries.find((e) => e.role === role)?.id ?? null })),
		candidates,
		callings: listStakeCallings(locals.db).map((c) => ({ id: c.id, name: c.name, presides: c.presides }))
	};
};

export const actions: Actions = {
	general: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		const ward = str(fd, 'ward_name');
		if (!ward) return fail(400, { error: 'Der Gemeindename darf nicht leer sein.' });
		setSetting(locals.db, 'ward_name', ward);
		return { saved: true };
	},
	bishopRole: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		const role = str(fd, 'role');
		if (!isBishopricRole(role)) return fail(400, { error: 'Ungültige Rolle.' });
		const id = optInt(fd, 'member');
		if (id && getMember(locals.db, id)?.kind !== 'gemeinde') return fail(400, { error: 'Bitte ein Gemeindemitglied auswählen.' });
		setBishopricMember(locals.db, role, id);
		return { saved: true };
	},
	presidesCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		setStakeCallingPresides(locals.db, int(fd, 'id'), fd.get('presides') === '1');
		return { saved: true };
	},
	addCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		try {
			createStakeCalling(locals.db, str(fd, 'name'));
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
		return { saved: true };
	},
	renameCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		try {
			renameStakeCalling(locals.db, int(fd, 'id'), str(fd, 'name'));
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
		return { saved: true };
	},
	deleteCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		if (!deleteStakeCalling(locals.db, int(fd, 'id'))) return fail(400, { error: 'Diese Berufung wird noch bei Pfahlbeamten verwendet.' });
		return { saved: true };
	},
	moveCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		moveStakeCalling(locals.db, int(fd, 'id'), str(fd, 'dir') === 'up' ? -1 : 1);
		return { saved: true };
	},
	ensureSundays: ({ locals }) => {
		requireRole(locals.user, 'settings.edit');
		const created = ensureSundays(locals.db, todayIso(), 12);
		return { created };
	}

};
