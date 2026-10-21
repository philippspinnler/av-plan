import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { YOUTH_BREAK_KINDS } from '$lib/server/db/schema';
import { failMessage, int, optStr, str } from '$lib/server/forms';
import { requireRole } from '$lib/server/permissions';
import { YOUTH_BREAK_KIND_LABELS, createBreak, deleteBreak, listBreaks } from '$lib/server/youth-breaks';
import { todayIso } from '$lib/dates';

export const load: PageServerLoad = ({ locals, url }) => {
	requireRole(locals.user, 'youth.common');
	const showAll = url.searchParams.get('alle') === '1';
	return { breaks: listBreaks(locals.db, showAll ? undefined : todayIso()), showAll, kinds: YOUTH_BREAK_KIND_LABELS };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireRole(locals.user, 'youth.common');
		const fd = await request.formData();
		const fromDate = str(fd, 'fromDate');
		const toDate = str(fd, 'toDate') || fromDate;
		const kind = YOUTH_BREAK_KINDS.find((k) => k === str(fd, 'kind'));
		if (!fromDate || !kind) return fail(400, { error: 'Bitte Datum und Art angeben.' });
		try {
			createBreak(locals.db, { fromDate, toDate, label: optStr(fd, 'label'), kind });
		} catch (e) {
			return fail(400, { error: failMessage(e) });
		}
	},
	delete: async ({ request, locals }) => {
		requireRole(locals.user, 'youth.common');
		deleteBreak(locals.db, int(await request.formData(), 'id'));
	}
};
