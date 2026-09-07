import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formatDateShort, todayIso } from '$lib/dates';
import { formatDuration, parseDuration } from '$lib/duration';
import { int, str } from '$lib/server/forms';
import { createHymn, listHymns } from '$lib/server/hymns';
import { can, requireRole } from '$lib/server/permissions';
import { hymnUsage } from '$lib/server/stats';

export const load: PageServerLoad = ({ locals }) => {
	const usage = hymnUsage(locals.db, todayIso());
	return {
		canEdit: can(locals.user!.role, 'hymns.edit'),
		hymns: listHymns(locals.db).map((h) => {
			const u = usage.get(h.id);
			return {
				number: h.number,
				title: h.title,
				book: h.book === 'neu' ? 'Neu' : 'Gesangbuch',
				duration: formatDuration(h.durationSeconds),
				lastSung: u?.lastSung ? formatDateShort(u.lastSung) : 'nie',
				count52: u?.count52 ?? 0
			};
		})
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireRole(locals.user, 'hymns.edit');
		const fd = await request.formData();
		const number = int(fd, 'number');
		const title = str(fd, 'title');
		const durationText = str(fd, 'duration');
		if (number <= 0 || !title) return fail(400, { error: 'Bitte Nummer und Titel angeben.' });
		if (durationText && parseDuration(durationText) === null) return fail(400, { error: 'Dauer bitte als m:ss angeben, z.B. 3:45.' });
		try {
			createHymn(locals.db, { number, title, durationSeconds: parseDuration(durationText) });
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
		redirect(303, `/lieder/${number}`);
	}
};
