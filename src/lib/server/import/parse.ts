import { toIso } from '../../dates';
import { parseDuration } from '../../duration';
import type { MeetingKind, Status } from '../db/schema';

type Obj = Record<string, unknown>;

export function cellText(v: unknown): string {
	if (v === null || v === undefined) return '';
	if (typeof v === 'string') return v.trim();
	if (typeof v === 'number') return String(v);
	if (v instanceof Date) return toIso(v);
	if (typeof v === 'object') {
		const o = v as Obj;
		if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((r) => r.text).join('').trim();
		if ('error' in o) return '';
		if ('result' in o) return cellText(o.result);
		if ('text' in o) return cellText(o.text);
	}
	return '';
}

export function cellNumber(v: unknown): number | null {
	if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : null;
	if (typeof v === 'object' && v !== null && 'result' in (v as Obj)) return cellNumber((v as Obj).result);
	const t = cellText(v);
	const m = t.match(/^(\d+)$/);
	return m ? parseInt(m[1], 10) : null;
}

export function cellDateIso(v: unknown): string | null {
	if (v instanceof Date) return toIso(v);
	if (typeof v === 'number') return v > 20000 ? toIso(new Date(Math.round((v - 25569) * 86_400_000))) : null;
	if (typeof v === 'object' && v !== null && 'result' in (v as Obj)) return cellDateIso((v as Obj).result);
	const m = cellText(v).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
	if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
	return null;
}

export function cellSeconds(v: unknown): number | null {
	if (v instanceof Date) {
		const s = v.getUTCHours() * 3600 + v.getUTCMinutes() * 60 + v.getUTCSeconds();
		return s > 0 ? s : null;
	}
	if (typeof v === 'number') {
		const s = Math.round(v * 86_400);
		return s > 0 ? s : null;
	}
	if (typeof v === 'object' && v !== null && 'result' in (v as Obj)) return cellSeconds((v as Obj).result);
	return parseDuration(cellText(v));
}

const IGNORED = new Set(['', '-', '–', 'pv', '#n/a', 'nn', '!', 'orgel', 'x', '?']);

export function isIgnoredToken(s: string): boolean {
	return IGNORED.has(s.trim().toLowerCase());
}

const KIND_KEYWORDS: [MeetingKind, string][] = [
	['generalkonferenz', 'generalkonferenz'],
	['pfahlkonferenz', 'pfahlkonferenz'],
	['gemeindekonferenz', 'gemeindekonferenz'],
	['fastsonntag', 'fastsonntag'],
	['fastsonntag', 'faststonntag']
];

export function parseSpezial(text: string): { kind: MeetingKind; note: string | null } {
	const lower = text.toLowerCase();
	let kind: MeetingKind = 'normal';
	let note = text;
	for (const [k, kw] of KIND_KEYWORDS) {
		const i = lower.indexOf(kw);
		if (i >= 0) {
			kind = k;
			note = text.slice(0, i) + text.slice(i + kw.length);
			break;
		}
	}
	note = note.replace(/^[\s,;/\-?]+|[\s,;/\-?]+$/g, '').trim();
	return { kind, note: note || null };
}

export function parseTalk(nameRaw: string, topicRaw: string, isPast: boolean): { name: string | null; topic: string | null; status: Status; note: string | null } {
	const name = isIgnoredToken(nameRaw) ? null : nameRaw.trim();
	let topic: string | null = topicRaw.trim() || null;
	let status: Status = 'zugesagt';
	let note: string | null = null;
	if (topic && /confirm/i.test(topic)) { status = 'angefragt'; topic = null; }
	else if (topic && /einladen/i.test(topic)) { status = 'offen'; topic = null; }
	else if (topic && /\?\?$/.test(topic)) { note = topic; topic = null; }
	if (isPast) status = 'zugesagt';
	return { name, topic, status, note };
}
