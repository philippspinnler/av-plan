import { collator, compareDate, sortRows, type ColumnSpec, type SortState } from './table-sort';

export type HymnSortKey = 'number' | 'title' | 'duration' | 'lastSung' | 'count52';
export type HymnSortState = SortState<HymnSortKey>;

export interface HymnRow {
	number: number;
	title: string;
	durationSeconds: number | null;
	lastSungDate: string | null;
	count52: number;
}

const COLUMNS: Record<HymnSortKey, ColumnSpec<HymnRow>> = {
	number: { compare: (a, b) => a.number - b.number },
	title: { compare: (a, b) => collator.compare(a.title, b.title) },
	duration: { compare: (a, b) => (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0), last: (h) => h.durationSeconds === null },
	lastSung: { compare: (a, b) => compareDate(a.lastSungDate, b.lastSungDate) },
	count52: { compare: (a, b) => a.count52 - b.count52 }
};

export function sortHymns<T extends HymnRow>(rows: T[], sort: HymnSortState): T[] {
	return sortRows(rows, sort, COLUMNS, (a, b) => a.number - b.number);
}
