import { addDays, formatDateDe } from '../dates';
import type { MeetingKind } from './db/schema';
import { hymnLabel } from './hymns';
import { displayName } from './members';
import { KIND_LABELS, type MeetingFull } from './meetings';
import { readiness } from './stats';

export interface MeetingSummary {
	date: string;
	dateLabel: string;
	kind: MeetingKind;
	kindLabel: string;
	theme: string | null;
	presiding: string | null;
	speakers: string[];
	hymns: string[];
	missingProgram: string[];
	missingMusic: string[];
}

export function summarize(m: MeetingFull, opts: { showProgram: boolean }): MeetingSummary {
	const r = readiness(m);
	return {
		date: m.meeting.date,
		dateLabel: formatDateDe(m.meeting.date),
		kind: m.meeting.kind,
		kindLabel: KIND_LABELS[m.meeting.kind],
		theme: m.meeting.theme,
		presiding: opts.showProgram && m.presiding ? displayName(m.presiding) : null,
		speakers: opts.showProgram ? m.talks.filter((t) => t.member).map((t) => displayName(t.member!)) : [],
		hymns: (['anfang', 'abendmahl', 'zwischen', 'schluss'] as const)
			.map((s) => m.hymns[s])
			.filter((h) => h.hymn || h.freeText)
			.map((h) => (h.hymn ? hymnLabel(h.hymn) : h.freeText!)),
		missingProgram: opts.showProgram ? r.program : [],
		missingMusic: r.music
	};
}

export function overviewRange(today: string, year: number | null): { from: string; to: string } {
	if (year) return { from: `${year}-01-01`, to: `${year}-12-31` };
	const dow = new Date(today + 'T00:00:00Z').getUTCDay();
	return { from: addDays(today, -dow), to: addDays(today, 12 * 7) };
}
