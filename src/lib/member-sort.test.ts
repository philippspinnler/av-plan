import { describe, expect, it } from 'vitest';
import { sortMembers, toggleSort, type MemberRow, type MemberSortState as SortState } from './member-sort';

const rows: MemberRow[] = [
	{ id: 1, sortName: 'Muster Anna', active: true, lastTalkDate: '2026-08-01', lastPrayerDate: null, noTalk: false, noPrayer: false },
	{ id: 2, sortName: 'Baumann Simon', active: false, lastTalkDate: null, lastPrayerDate: '2026-07-01', noTalk: false, noPrayer: false },
	{ id: 3, sortName: 'Zimmer Kurt', active: true, lastTalkDate: '2026-06-15', lastPrayerDate: '2026-09-01', noTalk: false, noPrayer: false }
];
const ids = (list: MemberRow[]) => list.map((r) => r.id);

describe('sortMembers', () => {
	it('sorts by name ascending and descending', () => {
		expect(ids(sortMembers(rows, { key: 'name', dir: 'asc' }))).toEqual([2, 1, 3]);
		expect(ids(sortMembers(rows, { key: 'name', dir: 'desc' }))).toEqual([3, 1, 2]);
	});
	it('sorts talks by date, "never" counts as oldest', () => {
		expect(ids(sortMembers(rows, { key: 'lastTalk', dir: 'asc' }))).toEqual([2, 3, 1]);
		expect(ids(sortMembers(rows, { key: 'lastTalk', dir: 'desc' }))).toEqual([1, 3, 2]);
	});
	it('sorts prayers by date', () => {
		expect(ids(sortMembers(rows, { key: 'lastPrayer', dir: 'asc' }))).toEqual([1, 2, 3]);
		expect(ids(sortMembers(rows, { key: 'lastPrayer', dir: 'desc' }))).toEqual([3, 2, 1]);
	});
	it('sorts by status, active first', () => {
		expect(ids(sortMembers(rows, { key: 'status', dir: 'asc' }))).toEqual([1, 3, 2]);
		expect(ids(sortMembers(rows, { key: 'status', dir: 'desc' }))).toEqual([2, 1, 3]);
	});
	it('puts "prefers not" last in the respective column', () => {
		const withFlags = [...rows, { id: 4, sortName: 'Arnold Dora', active: true, lastTalkDate: null, lastPrayerDate: null, noTalk: true, noPrayer: false }];
		expect(ids(sortMembers(withFlags, { key: 'lastTalk', dir: 'asc' }))).toEqual([2, 3, 1, 4]);
		expect(ids(sortMembers(withFlags, { key: 'lastTalk', dir: 'desc' }))).toEqual([1, 3, 2, 4]);
		expect(ids(sortMembers(withFlags, { key: 'lastPrayer', dir: 'asc' }))).toEqual([4, 1, 2, 3]);
	});
	it('does not mutate the input', () => {
		sortMembers(rows, { key: 'name', dir: 'desc' });
		expect(ids(rows)).toEqual([1, 2, 3]);
	});
});

describe('toggleSort', () => {
	it('flips direction on the same column, otherwise starts ascending', () => {
		const s: SortState = { key: 'name', dir: 'asc' };
		expect(toggleSort(s, 'name')).toEqual({ key: 'name', dir: 'desc' });
		expect(toggleSort({ key: 'name', dir: 'desc' }, 'name')).toEqual({ key: 'name', dir: 'asc' });
		expect(toggleSort(s, 'lastTalk')).toEqual({ key: 'lastTalk', dir: 'asc' });
	});
});
