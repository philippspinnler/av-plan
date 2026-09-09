import type { Db } from './db';
import { getSetting, setSetting } from './settings';

const ABSENCE_PREFIX = 'ids:';

export const BISHOPRIC_ROLES = ['bischof', 'ratgeber1', 'ratgeber2'] as const;
export type BishopricRole = (typeof BISHOPRIC_ROLES)[number];
export const BISHOPRIC_ROLE_LABELS: Record<BishopricRole, string> = {
	bischof: 'Bischof',
	ratgeber1: '1. Ratgeber',
	ratgeber2: '2. Ratgeber'
};
export interface BishopricEntry { id: number; role: BishopricRole }

const isRole = (r: unknown): r is BishopricRole => typeof r === 'string' && (BISHOPRIC_ROLES as readonly string[]).includes(r);

/**
 * Bischofschaft: je Rolle höchstens eine Person, je Person höchstens eine Rolle.
 * Fällt auf die alte Liste ohne Rollen zurück (Reihenfolge = Bischof, 1., 2. Ratgeber), solange nichts Neues gespeichert ist.
 */
export function getBishopric(db: Db): BishopricEntry[] {
	try {
		const v: unknown = JSON.parse(getSetting(db, 'bishopric'));
		if (Array.isArray(v) && v.length) return normalize(v.filter((e) => e && Number.isInteger(e.id) && e.id > 0 && isRole(e.role)));
	} catch {
		// weiter unten: alte Liste
	}
	return normalize(getLegacyIds(db).map((id, i) => ({ id, role: BISHOPRIC_ROLES[i] })).filter((e) => e.role));
}

function normalize(entries: BishopricEntry[]): BishopricEntry[] {
	const out: BishopricEntry[] = [];
	for (const role of BISHOPRIC_ROLES) {
		const e = entries.find((x) => x.role === role && !out.some((o) => o.id === x.id));
		if (e) out.push({ id: e.id, role });
	}
	return out;
}

function getLegacyIds(db: Db): number[] {
	try {
		const v: unknown = JSON.parse(getSetting(db, 'bishopric_member_ids'));
		return Array.isArray(v) ? v.filter((x): x is number => Number.isInteger(x) && x > 0) : [];
	} catch {
		return [];
	}
}

export function setBishopric(db: Db, entries: BishopricEntry[]): void {
	setSetting(db, 'bishopric', JSON.stringify(normalize(entries)));
}

export function getBishopricIds(db: Db): number[] {
	return getBishopric(db).map((e) => e.id);
}

/** Besetzt eine Rolle neu (null = frei). Die Person verliert eine allfällige andere Rolle. */
export function setBishopricMember(db: Db, role: BishopricRole, id: number | null): void {
	const rest = getBishopric(db).filter((e) => e.role !== role && e.id !== id);
	setBishopric(db, id ? [...rest, { id, role }] : rest);
}

/**
 * Wer hat den Vorsitz? Ein anwesender Gast mit Vorsitzrecht (z.B. Pfahlpräsidentschaft) vor dem Bischof,
 * dann 1. und 2. Ratgeber, jeweils sofern nicht abwesend. Null, wenn niemand bestimmt werden kann.
 */
export function chairFor(input: { bishopric: BishopricEntry[]; absentIds: number[]; guest: { id: number; presides: boolean } | null }): number | null {
	if (input.guest?.presides) return input.guest.id;
	for (const role of ['bischof', 'ratgeber1', 'ratgeber2'] as const) {
		const e = input.bishopric.find((b) => b.role === role);
		if (e && !input.absentIds.includes(e.id)) return e.id;
	}
	return null;
}

export function parseAbsences(text: string | null): { ids: number[]; legacy: string | null } {
	if (!text) return { ids: [], legacy: null };
	if (text.startsWith(ABSENCE_PREFIX)) {
		const ids = text
			.slice(ABSENCE_PREFIX.length)
			.split(',')
			.map(Number)
			.filter((n) => Number.isInteger(n) && n > 0);
		return { ids, legacy: null };
	}
	return { ids: [], legacy: text };
}

export function formatAbsences(ids: number[]): string | null {
	const clean = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))];
	return clean.length ? ABSENCE_PREFIX + clean.join(',') : null;
}
