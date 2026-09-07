import type { Actions, PageServerLoad } from './$types';
import { todayIso } from '$lib/dates';
import { ensureSundays, listMeetings } from '$lib/server/meetings';
import { overviewRange, summarize } from '$lib/server/overview';
import { can, requireRole } from '$lib/server/permissions';

export const load: PageServerLoad = ({ locals, url }) => {
	const today = todayIso();
	const yearParam = url.searchParams.get('jahr');
	const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;
	const range = overviewRange(today, year);
	const meetings = listMeetings(locals.db, range.from, range.to).map(summarize);
	const next = meetings.find((m) => m.date >= today) ?? null;
	const years: number[] = [];
	for (let y = Number(today.slice(0, 4)) - 1; y <= Number(today.slice(0, 4)) + 1; y++) years.push(y);
	return {
		today,
		year,
		years,
		next,
		meetings,
		role: locals.user!.role,
		canCreate: can(locals.user!.role, 'meetings.create')
	};
};

export const actions: Actions = {
	ensure: ({ locals }) => {
		requireRole(locals.user, 'meetings.create');
		const created = ensureSundays(locals.db, todayIso(), 12);
		return { created };
	}
};
