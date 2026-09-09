import type { PageServerLoad } from './$types';
import { formatDateLong, todayIso } from '$lib/dates';
import { adjacentMeetingDates, listMeetings, loadMeetingFullByDate } from '$lib/server/meetings';
import { overviewRange, summarize } from '$lib/server/overview';
import { can } from '$lib/server/permissions';

export const load: PageServerLoad = ({ locals, url }) => {
	const today = todayIso();
	const role = locals.user!.role;
	const showProgram = can(role, 'program.view');
	const showPrayers = can(role, 'meeting.prayers');
	/** Rolle "Gebete": nur Gebete zeigen, keine Themen, Lieder oder Musik. */
	const showHymns = can(role, 'hymns.view');
	const prayersOnly = showPrayers && !showProgram && !showHymns;
	/** Musik und Dirigent: Orgel und Dirigieren als eigene Spalten. */
	const musicColumns = showHymns && !showProgram;
	const yearParam = url.searchParams.get('jahr');
	const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;
	const range = overviewRange(today, year);
	const meetings = listMeetings(locals.db, range.from, range.to).map((m) => summarize(m, { showProgram, showPrayers }));
	const upcoming = meetings.find((m) => m.date >= today) ?? null;
	const datum = url.searchParams.get('datum');
	const picked = datum && /^\d{4}-\d{2}-\d{2}$/.test(datum) ? loadMeetingFullByDate(locals.db, datum) : null;
	const next = picked ? summarize(picked, { showProgram, showPrayers }) : upcoming;
	const nav = next ? { ...adjacentMeetingDates(locals.db, next.date), isUpcoming: next.date === upcoming?.date } : null;
	const years: number[] = [];
	for (let y = Number(today.slice(0, 4)) - 1; y <= Number(today.slice(0, 4)) + 1; y++) years.push(y);
	return {
		today,
		year,
		years,
		next,
		nextTitle: next ? formatDateLong(next.date) : null,
		nav,
		meetings,
		role,
		showProgram,
		showHymns,
		prayersOnly,
		musicColumns
	};
};

