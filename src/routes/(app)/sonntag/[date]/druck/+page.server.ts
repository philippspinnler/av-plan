import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { formatDateDe, isSunday } from '$lib/dates';
import { computeTimes, hymnMinutes, programOrder } from '$lib/schedule';
import { hymnLabel } from '$lib/server/hymns';
import { displayName } from '$lib/server/members';
import { KIND_LABELS, hasProgram, loadMeetingFullByDate } from '$lib/server/meetings';
import { requireRole } from '$lib/server/permissions';
import { getAllSettings } from '$lib/server/settings';
import { PRINT_TEXTS } from '$lib/print/texts';

export const load: PageServerLoad = ({ locals, params }) => {
	requireRole(locals.user, 'program.view');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date) || !isSunday(params.date)) error(404, 'Kein gültiges Sonntagsdatum');
	const full = loadMeetingFullByDate(locals.db, params.date);
	if (!full) error(404, 'Sonntag nicht gefunden');
	const settings = getAllSettings(locals.db);
	const m = full.meeting;
	const talks = full.talks.filter((t) => t.member || t.topic);
	const timed = computeTimes(
		m.talksStartTime ?? settings.talks_start_time_default,
		programOrder(talks.map((t) => t.position)),
		new Map(talks.map((t) => [t.position, t.durationMinutes])),
		hymnMinutes(full.hymns.zwischen.hymn?.durationSeconds ?? null)
	);
	const hymn = (slot: 'anfang' | 'abendmahl' | 'zwischen' | 'schluss') => {
		const h = full.hymns[slot];
		return h.hymn ? hymnLabel(h.hymn) : (h.freeText ?? '');
	};
	const prayer = (pos: number) => {
		const p = full.prayers.find((x) => x.position === pos);
		return p?.member ? displayName(p.member) : '';
	};
	return {
		date: params.date,
		dateLabel: formatDateDe(params.date),
		kindLabel: KIND_LABELS[m.kind],
		isFast: m.kind === 'fastsonntag',
		hasProgram: hasProgram(m.kind),
		wardName: settings.ward_name,
		meetingStart: settings.meeting_start_time,
		presiding: full.presiding ? displayName(full.presiding) : '',
		theme: m.theme ?? '',
		specialNote: m.specialNote ?? '',
		announcements: full.announcements,
		releases: full.callings.filter((c) => c.kind === 'entlassung'),
		sustainings: full.callings.filter((c) => c.kind === 'berufung'),
		hymns: { anfang: hymn('anfang'), abendmahl: hymn('abendmahl'), zwischen: hymn('zwischen'), schluss: hymn('schluss') },
		prayers: { opening: prayer(1), closing: prayer(2) },
		program: timed.map((x) => {
			const time = x.start && x.end ? `${x.start} – ${x.end}` : '';
			if (x.item.type === 'zwischenlied') return { label: 'Zwischenlied', detail: hymn('zwischen'), time };
			const position = x.item.position;
			const t = talks.find((tt) => tt.position === position)!;
			return { label: `Ansprache ${t.position}`, detail: [t.member ? displayName(t.member) : '', t.topic ?? ''].filter(Boolean).join(' – '), time };
		}),
		organist: full.organist ? displayName(full.organist) : '',
		conductor: full.conductor ? displayName(full.conductor) : '',
		texts: PRINT_TEXTS
	};
};
