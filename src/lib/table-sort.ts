export type SortDir = 'asc' | 'desc';
export interface SortState<K extends string = string> { key: K; dir: SortDir }

export interface ColumnSpec<T> {
	compare: (a: T, b: T) => number;
	/** Zeilen, die unabhängig von der Richtung ans Ende gehören (z.B. leere Werte). */
	last?: (row: T) => boolean;
}

export const collator = new Intl.Collator('de', { sensitivity: 'base' });

export function compareDate(a: string | null, b: string | null): number {
	return (a ?? '') < (b ?? '') ? -1 : (a ?? '') > (b ?? '') ? 1 : 0;
}

export function sortRows<T, K extends string>(rows: T[], sort: SortState<K>, columns: Record<K, ColumnSpec<T>>, tiebreak: (a: T, b: T) => number): T[] {
	const col = columns[sort.key];
	const sign = sort.dir === 'asc' ? 1 : -1;
	const last = col.last ?? (() => false);
	return [...rows].sort((a, b) => Number(last(a)) - Number(last(b)) || sign * col.compare(a, b) || tiebreak(a, b));
}

export function toggleSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
	if (current.key !== key) return { key, dir: 'asc' };
	return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
}
