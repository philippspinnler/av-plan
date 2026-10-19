import { isSunday, toIso } from '../../dates';
import type { Db } from '../db';
import type { Member, YouthEventKind, YouthSide } from '../db/schema';
import { matchByFirstName } from '../members';
import { ensureYouthEvents, isWednesday, loadYouthEvent, saveYouthAdults, saveYouthCommon, saveYouthPart, YOUTH_KIND_LABELS } from '../youth';
import { createBreak, listBreaks } from '../youth-breaks';
import { listAdults, listYouth } from '../youth-people';

export interface YouthImportReport { events: number; breaks: number; warnings: string[] }

/** Minimal RFC-4180 parser: quoted fields may contain commas, doubled quotes and newlines. */
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cur = '';
	let quoted = false;
	const endRow = () => { row.push(cur); cur = ''; if (row.some((c) => c.trim())) rows.push(row); row = []; };
	for (let i = text.replace(/^﻿/, '').length ? 0 : 0, t = text.replace(/^﻿/, ''); i < t.length; i++) {
		const ch = t[i];
		if (quoted) {
			if (ch === '"' && t[i + 1] === '"') { cur += '"'; i++; }
			else if (ch === '"') quoted = false;
			else cur += ch;
		} else if (ch === '"') quoted = true;
		else if (ch === ',') { row.push(cur); cur = ''; }
		else if (ch === '\n') endRow();
		else if (ch !== '\r') cur += ch;
	}
	if (cur || row.length) endRow();
	return rows;
}

const norm = (h: string) => h.trim().replace(/:$/, '').trim().toLowerCase();
function records(csv: string): Record<string, string>[] {
	const [head, ...rows] = parseCsv(csv);
	if (!head) return [];
	const keys = head.map(norm);
	return rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

function isoDate(s: string): string | null {
	const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
	if (!m) return null;
	const iso = toIso(new Date(Date.UTC(+m[3], +m[1] - 1, +m[2])));
	return iso;
}

const ACTIVITY_KINDS: Record<string, { kind: YouthEventKind; joint: boolean }> = {
	'aktivitäten pratteln jd ap': { kind: 'aktivitaet', joint: false },
	'jd/ap pratteln gemeinsam': { kind: 'aktivitaet', joint: true },
	'gemeinsam mit basel': { kind: 'basel', joint: true },
	'pfahl-aktivität': { kind: 'pfahl', joint: false },
	'tempel taufen': { kind: 'tempel', joint: false },
	fireside: { kind: 'fireside', joint: false },
	übertragung: { kind: 'uebertragung', joint: false }
};
const JM_GROUPS: Record<string, string> = { 'priester kollegium': 'priester', 'lehrer kollegium': 'lehrer', 'diakons kollegium': 'diakone', leitung: 'leitung' };
const JD_GROUPS: Record<string, string> = { 'jd der hoffnung': 'hoffnung', 'jd des glaubens': 'glauben', 'jd des lichts': 'licht', leitung: 'leitung' };

export function importYouthCsv(db: Db, activitiesCsv: string, classesCsv: string, opts: { log?: (s: string) => void } = {}): YouthImportReport {
	const report: YouthImportReport = { events: 0, breaks: 0, warnings: [] };
	const warn = (w: string) => { report.warnings.push(w); opts.log?.(`Hinweis: ${w}`); };
	const youth: Record<YouthSide, Member[]> = { jd: listYouth(db, 'jd').map((y) => y.member), jm: listYouth(db, 'jm').map((y) => y.member) };
	const adults = listAdults(db);
	const dates = new Set<string>();

	/** Resolves a first name; on failure warns and records the text for `details`. */
	const resolve = (date: string, field: string, name: string, pool: Member[], lost: string[]): Member | null => {
		if (!name) return null;
		const hit = matchByFirstName(pool, name);
		if (!hit) { warn(`${date}: ${field} '${name}' nicht gefunden`); lost.push(`${field}: ${name}`); }
		return hit;
	};
	const thoughts = (date: string, raw: string, lost: string[]): Record<YouthSide, Member | null> => {
		const out: Record<YouthSide, Member | null> = { jd: null, jm: null };
		for (const item of raw.split(',')) {
			const m = /^\s*(JD|JM)\s*:\s*(.+?)\s*$/i.exec(item);
			if (!m) { if (item.trim()) warn(`${date}: Geistiger Gedanke '${item.trim()}' nicht erkannt`); continue; }
			const side = m[1].toLowerCase() as YouthSide;
			out[side] = resolve(date, `Geistiger Gedanke ${m[1].toUpperCase()}`, m[2], youth[side], lost);
		}
		return out;
	};
	const adultEntries = (date: string, r: Record<string, string>, lost: string[]) => {
		const entries: { memberId: number; present: boolean }[] = [];
		for (const [field, present] of [['Anwesende Erw.', true], ['Abwesende Erw.', false]] as const) {
			for (const name of r[norm(field)].split(',')) {
				const m = resolve(date, field, name.trim(), adults, lost);
				if (m) entries.push({ memberId: m.id, present });
			}
		}
		return entries;
	};
	const store = (date: string, common: { kind: YouthEventKind; joint: boolean; details: string; topic: string; snack: string }, parts: Partial<Record<'jd' | 'jm' | 'both', { text: string | null; leaderMemberId: number | null; leaderGroup: string | null; thoughtMemberId: number | null }>>, adultList: { memberId: number; present: boolean }[], lost: string[]) => {
		ensureYouthEvents(db, date, 0);
		const id = loadYouthEvent(db, date)!.event.id;
		const details = [common.details, ...lost].filter(Boolean).join('\n') || null;
		saveYouthCommon(db, id, { kind: common.kind, joint: common.joint, details, topic: common.topic || null, topicUrl: null, snack: common.snack || null });
		for (const [side, p] of Object.entries(parts)) saveYouthPart(db, id, side as 'jd' | 'jm' | 'both', p);
		const old = loadYouthEvent(db, date)!.adults.map((a) => ({ memberId: a.member.id, present: null }));
		saveYouthAdults(db, id, [...old, ...adultList]);
		dates.add(date);
	};

	for (const r of records(activitiesCsv)) {
		const date = isoDate(r['datum']);
		if (!date) { warn(`Ungültiges Datum '${r['datum']}' in den Aktivitäten`); continue; }
		const label = r['art der aktivität'];
		const lower = label.toLowerCase();
		const spec = lower === 'keine aktivität'
			? { kind: (r['details'].toLowerCase().includes('ferien') ? 'ferien' : 'keine') as YouthEventKind, joint: false }
			: ACTIVITY_KINDS[lower];
		if (!spec) { warn(`${date}: Art der Aktivität '${label}' unbekannt, Zeile übersprungen`); continue; }
		if (!isWednesday(date)) {
			if (spec.kind === 'pfahl' || spec.kind === 'tempel') {
				const label = r['details'] || YOUTH_KIND_LABELS[spec.kind];
				if (!listBreaks(db).some((b) => b.fromDate === date && b.toDate === date && b.kind === spec.kind)) {
					createBreak(db, { fromDate: date, toDate: date, label, kind: spec.kind });
					report.breaks++;
					opts.log?.(`Pause ${date}: ${label}`);
				}
			} else warn(`${date}: kein Mittwoch, Zeile übersprungen`);
			continue;
		}
		const lost: string[] = [];
		const th = thoughts(date, r['geistiger gedanke / klasse'], lost);
		const lead = { jd: resolve(date, 'Leitung JD', r['leitung jd'], youth.jd, lost), jm: resolve(date, 'Leitung JM', r['leitung jm'], youth.jm, lost) };
		const part = (side: YouthSide) => ({ text: r[`aktivität ${side}`] || null, leaderMemberId: lead[side]?.id ?? null, leaderGroup: null, thoughtMemberId: th[side]?.id ?? null });
		const jd = part('jd');
		const jm = part('jm');
		const both = { text: [jd.text, jm.text].filter(Boolean).join('\n') || null, leaderMemberId: jd.leaderMemberId ?? jm.leaderMemberId, leaderGroup: null, thoughtMemberId: jd.thoughtMemberId ?? jm.thoughtMemberId };
		store(date, { ...spec, details: r['details'], topic: r['thema'], snack: r['snack'] }, spec.joint ? { both } : { jd, jm }, adultEntries(date, r, lost), lost);
	}

	for (const r of records(classesCsv)) {
		const date = isoDate(r['datum']);
		if (!date) { warn(`Ungültiges Datum '${r['datum']}' in den Sonntagsklassen`); continue; }
		if (!isSunday(date)) { warn(`${date}: kein Sonntag, Zeile übersprungen`); continue; }
		const lost: string[] = [];
		const th = thoughts(date, r['geistiger gedanke / klasse'], lost);
		const group = (side: YouthSide, map: Record<string, string>) => {
			const raw = r[`leitung ${side}`];
			if (raw && !map[raw.toLowerCase()]) warn(`${date}: Leitung ${side.toUpperCase()} '${raw}' unbekannt`);
			return map[raw.toLowerCase()] ?? null;
		};
		const part = (side: YouthSide, map: Record<string, string>) => ({ text: null, leaderMemberId: null, leaderGroup: group(side, map), thoughtMemberId: th[side]?.id ?? null });
		store(date, { kind: 'klasse', joint: false, details: r['details'], topic: r['thema'], snack: '' }, { jd: part('jd', JD_GROUPS), jm: part('jm', JM_GROUPS) }, adultEntries(date, r, lost), lost);
	}

	report.events = dates.size;
	return report;
}
