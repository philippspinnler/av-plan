import { describe, expect, it } from 'vitest';
import { sortMembers, toggleSort, type MemberRow, type MemberSortState as SortState } from './member-sort';

const rows: MemberRow[] = [
	{ id: 1, sortName: 'Muster Anna', active: true, lastTalkDate: '2026-08-01', lastPrayerDate: null, notes: 'b', noTalk: false, noPrayer: false },
	{ id: 2, sortName: 'Baumann Simon', active: false, lastTalkDate: null, lastPrayerDate: '2026-07-01', notes: '', noTalk: false, noPrayer: false },
	{ id: 3, sortName: 'Zimmer Kurt', active: true, lastTalkDate: '2026-06-15', lastPrayerDate: '2026-09-01', notes: 'a', noTalk: false, noPrayer: false }
];
const ids = (list: MemberRow[]) => list.map((r) => r.id);

describe('sortMembers', () => {
	it('sortiert nach Name auf- und absteigend', () => {
		expect(ids(sortMembers(rows, { key: 'name', dir: 'asc' }))).toEqual([2, 1, 3]);
		expect(ids(sortMembers(rows, { key: 'name', dir: 'desc' }))).toEqual([3, 1, 2]);
	});
	it('sortiert Ansprachen nach Datum, "nie" gilt als am ältesten', () => {
		expect(ids(sortMembers(rows, { key: 'lastTalk', dir: 'asc' }))).toEqual([2, 3, 1]);
		expect(ids(sortMembers(rows, { key: 'lastTalk', dir: 'desc' }))).toEqual([1, 3, 2]);
	});
	it('sortiert Gebete nach Datum', () => {
		expect(ids(sortMembers(rows, { key: 'lastPrayer', dir: 'asc' }))).toEqual([1, 2, 3]);
		expect(ids(sortMembers(rows, { key: 'lastPrayer', dir: 'desc' }))).toEqual([3, 2, 1]);
	});
	it('sortiert Notizen alphabetisch, leere zuletzt', () => {
		expect(ids(sortMembers(rows, { key: 'notes', dir: 'asc' }))).toEqual([3, 1, 2]);
		expect(ids(sortMembers(rows, { key: 'notes', dir: 'desc' }))).toEqual([1, 3, 2]);
	});
	it('sortiert Status, aktive zuerst', () => {
		expect(ids(sortMembers(rows, { key: 'status', dir: 'asc' }))).toEqual([1, 3, 2]);
		expect(ids(sortMembers(rows, { key: 'status', dir: 'desc' }))).toEqual([2, 1, 3]);
	});
	it('setzt "möchte nicht" in der jeweiligen Spalte ans Ende', () => {
		const withFlags = [...rows, { id: 4, sortName: 'Arnold Dora', active: true, lastTalkDate: null, lastPrayerDate: null, notes: '', noTalk: true, noPrayer: false }];
		expect(ids(sortMembers(withFlags, { key: 'lastTalk', dir: 'asc' }))).toEqual([2, 3, 1, 4]);
		expect(ids(sortMembers(withFlags, { key: 'lastTalk', dir: 'desc' }))).toEqual([1, 3, 2, 4]);
		expect(ids(sortMembers(withFlags, { key: 'lastPrayer', dir: 'asc' }))).toEqual([4, 1, 2, 3]);
	});
	it('verändert die Eingabe nicht', () => {
		sortMembers(rows, { key: 'name', dir: 'desc' });
		expect(ids(rows)).toEqual([1, 2, 3]);
	});
});

describe('toggleSort', () => {
	it('wechselt bei gleicher Spalte die Richtung, sonst beginnt sie aufsteigend', () => {
		const s: SortState = { key: 'name', dir: 'asc' };
		expect(toggleSort(s, 'name')).toEqual({ key: 'name', dir: 'desc' });
		expect(toggleSort({ key: 'name', dir: 'desc' }, 'name')).toEqual({ key: 'name', dir: 'asc' });
		expect(toggleSort(s, 'lastTalk')).toEqual({ key: 'lastTalk', dir: 'asc' });
	});
});
