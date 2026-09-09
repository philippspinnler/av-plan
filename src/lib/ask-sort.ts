import { collator, compareDate, sortRows, type ColumnSpec, type SortState } from './table-sort';

export type AskSortKey = 'name' | 'last' | 'note';
export type AskSortState = SortState<AskSortKey>;

export interface AskRow {
	id: number;
	name: string;
	sortName: string;
	lastDate: string | null;
	nextDate: string | null;
	/** "nie", "vor 3 Wochen" oder bei Eingeplanten "in 4 Wochen". */
	label: string;
	planned: boolean;
	note: string;
}

/** Nicht Eingeplante zuerst ("nie", dann längste Pause), Eingeplante danach mit dem nächsten Termin zuerst. */
function compareDue(a: AskRow, b: AskRow): number {
	if (a.planned !== b.planned) return Number(a.planned) - Number(b.planned);
	return a.planned ? compareDate(a.nextDate, b.nextDate) : compareDate(a.lastDate, b.lastDate);
}

const COLUMNS: Record<AskSortKey, ColumnSpec<AskRow>> = {
	name: { compare: (a, b) => collator.compare(a.sortName, b.sortName) },
	last: { compare: compareDue },
	note: { compare: (a, b) => collator.compare(a.note, b.note), last: (r) => !r.note }
};

/** Standard: wer am längsten nicht dran war, zuerst ("nie" ganz oben); Eingeplante am Ende. */
export const DEFAULT_ASK_SORT: AskSortState = { key: 'last', dir: 'asc' };

export function sortAskRows(rows: AskRow[], sort: AskSortState): AskRow[] {
	return sortRows(rows, sort, COLUMNS, (a, b) => collator.compare(a.sortName, b.sortName));
}
