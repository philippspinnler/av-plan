import type { Db } from './db';
import { getSetting, setSetting } from './settings';

const ABSENCE_PREFIX = 'ids:';

export function getBishopricIds(db: Db): number[] {
	try {
		const v: unknown = JSON.parse(getSetting(db, 'bishopric_member_ids'));
		return Array.isArray(v) ? v.filter((x): x is number => Number.isInteger(x) && x > 0) : [];
	} catch {
		return [];
	}
}

export function setBishopricIds(db: Db, ids: number[]): void {
	setSetting(db, 'bishopric_member_ids', JSON.stringify([...new Set(ids)]));
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
