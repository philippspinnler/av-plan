import type { PageServerLoad } from './$types';
import { formatDateDe, todayIso } from '$lib/dates';
import { overviewRange } from '$lib/server/overview';
import { requireRole } from '$lib/server/permissions';
import { ensureYouthEvents, isFifthSunday, listYouthEvents, YOUTH_KIND_LABELS, type YouthEventFull } from '$lib/server/youth';
import { YOUTH_GROUP_LABELS } from '$lib/server/youth-people';

function summary(e: YouthEventFull, side: 'jd' | 'jm'): string | null {
	const part = e.parts.find((p) => p.side === side) ?? e.parts.find((p) => p.side === 'both');
	if (!part) return null;
	const base = e.weekday === 'wednesday' ? part.text : part.leaderGroup ? (YOUTH_GROUP_LABELS[part.leaderGroup] ?? part.leaderGroup) : null;
	if (!base) return null;
	return part.thought ? `${base} · ${part.thought.firstName}` : base;
}

export const load: PageServerLoad = ({ locals, url }) => {
	requireRole(locals.user, 'youth.view');
	const today = todayIso();
	ensureYouthEvents(locals.db, today);
	const yearParam = url.searchParams.get('jahr');
	const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;
	const range = overviewRange(today, year);
	const rows = listYouthEvents(locals.db, range.from, range.to).map((e) => {
		const fifth = isFifthSunday(e.event.date) && e.event.kind !== 'erwachsene';
		return {
			date: e.event.date,
			dateLabel: formatDateDe(e.event.date),
			weekday: e.weekday,
			kindLabel: YOUTH_KIND_LABELS[e.event.kind],
			status: e.status,
			offLabel: e.offLabel,
			jd: summary(e, 'jd'),
			jm: summary(e, 'jm'),
			snack: e.event.snack,
			fifth,
			hint: fifth ? '5. Sonntag – Klasse mit Erwachsenen?' : null
		};
	});
	const years: number[] = [];
	for (let y = Number(today.slice(0, 4)) - 1; y <= Number(today.slice(0, 4)) + 1; y++) years.push(y);
	return { rows, years, year, today };
};
