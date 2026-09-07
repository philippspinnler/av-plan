import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { str } from '$lib/server/forms';
import { requireRole } from '$lib/server/permissions';
import { getAllSettings, setSetting } from '$lib/server/settings';

const TIME = /^\d{2}:\d{2}$/;

export const load: PageServerLoad = ({ locals }) => {
	requireRole(locals.user, 'settings.edit');
	return { settings: getAllSettings(locals.db) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		const talks = str(fd, 'talks_start_time_default');
		const start = str(fd, 'meeting_start_time');
		const ward = str(fd, 'ward_name');
		if (!TIME.test(talks) || !TIME.test(start)) return fail(400, { error: 'Zeiten bitte als HH:MM angeben.' });
		if (!ward) return fail(400, { error: 'Der Gemeindename darf nicht leer sein.' });
		setSetting(locals.db, 'talks_start_time_default', talks);
		setSetting(locals.db, 'meeting_start_time', start);
		setSetting(locals.db, 'ward_name', ward);
		return { saved: true };
	}
};
