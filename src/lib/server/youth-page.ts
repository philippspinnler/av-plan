import { randomBytes } from 'node:crypto';
import { addDays, parseIso } from '../dates';
import type { Db } from './db';
import type { Member, YouthPartSide } from './db/schema';
import { listYouthEvents, YOUTH_KIND_LABELS, type YouthEventFull } from './youth';
import { listBreaks } from './youth-breaks';
import { listYouth, YOUTH_GROUP_LABELS } from './youth-people';

export interface YouthPageItem {
	date: string;
	weekday: 'sunday' | 'wednesday' | 'other';
	weekdayLabel: string;
	dateLabel: string;
	shortDate: string;
	kindLabel: string;
	status: 'off' | 'open' | 'planned';
	offLabel: string | null;
	topic: string | null;
	topicUrl: string | null;
	snack: string | null;
	joint: boolean;
	parts: { side: YouthPartSide; label: 'Junge Damen' | 'Junge Männer' | null; text: string | null; leaderName: string | null; thoughtName: string | null }[];
}

const DAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_SHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
const SIDE_LABELS = { jd: 'Junge Damen', jm: 'Junge Männer', both: null } as const;

export const newYouthPageToken = () => randomBytes(18).toString('base64url');

export function shortNames(youth: Member[]): Map<number, string> {
	const count = new Map<string, number>();
	for (const m of youth) count.set(m.firstName, (count.get(m.firstName) ?? 0) + 1);
	return new Map(youth.map((m) => [m.id, (count.get(m.firstName) ?? 0) > 1 ? `${m.firstName} ${m.lastName.charAt(0)}.` : m.firstName]));
}

function labels(date: string) {
	const d = parseIso(date);
	return {
		weekdayLabel: DAYS_LONG[d.getUTCDay()],
		dateLabel: `${d.getUTCDate()}. ${MONTHS_LONG[d.getUTCMonth()]}`,
		shortDate: `${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()}. ${MONTHS_SHORT[d.getUTCMonth()]}`
	};
}

function toItem(e: YouthEventFull, names: Map<number, string>): YouthPageItem {
	const date = e.event.date;
	const name = (m: Member | null) => (m ? (names.get(m.id) ?? null) : null);
	const kindLabel = e.status === 'off' ? 'Kein JD/JM' : e.event.joint ? 'Gemeinsam' : YOUTH_KIND_LABELS[e.event.kind];
	return {
		date, weekday: e.weekday, ...labels(date), kindLabel, status: e.status, offLabel: e.offLabel,
		topic: e.event.topic, topicUrl: e.event.topicUrl, snack: e.event.snack, joint: e.event.joint,
		parts: e.parts.map((p) => ({
			side: p.side, label: SIDE_LABELS[p.side], text: p.text,
			leaderName: name(p.leader) ?? (p.leaderGroup ? (YOUTH_GROUP_LABELS[p.leaderGroup] ?? p.leaderGroup) : null),
			thoughtName: name(p.thought)
		}))
	};
}

export function youthPageItems(db: Db, today: string, opts = { big: 2, small: 3 }): { big: YouthPageItem[]; small: YouthPageItem[] } {
	const total = opts.big + opts.small;
	const names = shortNames(listYouth(db).map((y) => y.member));
	const events = listYouthEvents(db, today, addDays(today, 7 * total)).slice(0, total).map((e) => toItem(e, names));
	const big = events.slice(0, opts.big);
	const small = events.slice(opts.big);
	const last = events[events.length - 1]?.date ?? today;
	for (const b of listBreaks(db, today)) {
		const date = b.fromDate < today ? today : b.fromDate;
		const offLabel = b.label ?? YOUTH_KIND_LABELS[b.kind];
		if (b.kind === 'ferien' || date > last || events.some((e) => e.date === date && e.status === 'off' && e.offLabel === offLabel)) continue;
		small.push({
			date, weekday: 'other', ...labels(date), kindLabel: YOUTH_KIND_LABELS[b.kind], status: 'off',
			offLabel, topic: null, topicUrl: null, snack: null, joint: false, parts: []
		});
	}
	small.sort((a, b) => a.date.localeCompare(b.date));
	return { big, small };
}

/** Compact one-line description of an item for the "Danach" list. */
export function compactText(i: YouthPageItem): string {
	if (i.status === 'off') return `${i.kindLabel} – ${i.offLabel}`;
	if (i.status === 'open') return `${i.kindLabel} · noch nicht geplant`;
	const join = (xs: (string | null)[]) => (xs.some(Boolean) ? [...new Set(xs.map((x) => x ?? '–'))].join(' / ') : null);
	const parts = [
		i.kindLabel,
		i.weekday === 'sunday' ? i.topic : join(i.parts.map((p) => p.text)),
		i.weekday === 'sunday' ? null : join(i.parts.map((p) => p.leaderName)) && `Leitung: ${join(i.parts.map((p) => p.leaderName))}`,
		join(i.parts.map((p) => p.thoughtName)) && `Gedanke: ${join(i.parts.map((p) => p.thoughtName))}`
	];
	return parts.filter(Boolean).join(' · ');
}
