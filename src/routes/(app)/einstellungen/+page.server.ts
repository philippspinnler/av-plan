import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { str } from '$lib/server/forms';
import { requireRole } from '$lib/server/permissions';
import { getAllSettings, setSetting } from '$lib/server/settings';

export const load: PageServerLoad = ({ locals }) => {
	requireRole(locals.user, 'settings.edit');
	return { settings: getAllSettings(locals.db) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		const ward = str(fd, 'ward_name');
		if (!ward) return fail(400, { error: 'Der Gemeindename darf nicht leer sein.' });
		setSetting(locals.db, 'ward_name', ward);
		return { saved: true };
	}
};
