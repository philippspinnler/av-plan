import { collator, compareDate, sortRows, toggleSort, type ColumnSpec, type SortState } from './table-sort';

export type SortKey = 'name' | 'lastTalk' | 'lastPrayer' | 'notes' | 'status';
export type { SortDir } from './table-sort';
export { toggleSort };
export type MemberSortState = SortState<SortKey>;

export interface MemberRow {
	id: number;
	sortName: string;
	active: boolean;
	lastTalkDate: string | null;
	lastPrayerDate: string | null;
	notes: string;
	noTalk: boolean;
	noPrayer: boolean;
}

const COLUMNS: Record<SortKey, ColumnSpec<MemberRow>> = {
	name: { compare: (a, b) => collator.compare(a.sortName, b.sortName) },
	lastTalk: { compare: (a, b) => compareDate(a.lastTalkDate, b.lastTalkDate), last: (m) => m.noTalk },
	lastPrayer: { compare: (a, b) => compareDate(a.lastPrayerDate, b.lastPrayerDate), last: (m) => m.noPrayer },
	notes: { compare: (a, b) => collator.compare(a.notes, b.notes), last: (m) => !m.notes },
	status: { compare: (a, b) => Number(b.active) - Number(a.active) }
};

export function sortMembers<T extends MemberRow>(rows: T[], sort: MemberSortState): T[] {
	return sortRows(rows, sort, COLUMNS, (a, b) => collator.compare(a.sortName, b.sortName));
}
