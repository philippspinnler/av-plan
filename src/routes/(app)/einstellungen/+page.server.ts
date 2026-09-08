import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { todayIso } from '$lib/dates';
import { getBishopricIds, setBishopricIds } from '$lib/server/bishopric';
import { int, str } from '$lib/server/forms';
import { displayName, getMember, listMembers } from '$lib/server/members';
import { requireRole } from '$lib/server/permissions';
import { memberOptions } from '$lib/server/picker';
import { getAllSettings, setSetting } from '$lib/server/settings';
import { ensureSundays } from '$lib/server/meetings';

export const load: PageServerLoad = ({ locals }) => {
	requireRole(locals.user, 'settings.edit');
	const all = listMembers(locals.db);
	const ids = getBishopricIds(locals.db);
	const bishopric = ids
		.map((id) => all.find((m) => m.id === id))
		.filter((m): m is NonNullable<typeof m> => !!m)
		.map((m) => ({ id: m.id, name: displayName(m) }));
	const candidates = memberOptions(all.filter((m) => !ids.includes(m.id)), new Map(), 'plain', todayIso());
	return { settings: getAllSettings(locals.db), bishopric, candidates };
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
	addBishop: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		const id = int(fd, 'member');
		if (!id || !getMember(locals.db, id)) return fail(400, { error: 'Bitte eine Person auswählen.' });
		setBishopricIds(locals.db, [...getBishopricIds(locals.db), id]);
		return { saved: true };
	},
	ensureSundays: ({ locals }) => {
		requireRole(locals.user, 'settings.edit');
		const created = ensureSundays(locals.db, todayIso(), 12);
		return { created };
	},
	removeBishop: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		const id = int(fd, 'member');
		setBishopricIds(locals.db, getBishopricIds(locals.db).filter((x) => x !== id));
		return { saved: true };
	}
};
