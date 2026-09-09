import { describe, expect, it } from 'vitest';
import { sortHymns, type HymnRow } from './hymn-sort';

const rows: HymnRow[] = [
	{ number: 5, title: 'Herr, unser Erlöser', durationSeconds: 250, lastSungDate: '2026-04-19', count52: 2 },
	{ number: 12, title: 'Gott des Rechtes', durationSeconds: null, lastSungDate: null, count52: 0 },
	{ number: 1001, title: 'Ein neues Lied', durationSeconds: 180, lastSungDate: '2026-08-30', count52: 1 }
];
const nums = (r: HymnRow[]) => r.map((x) => x.number);

describe('sortHymns', () => {
	it('sortiert nach Nummer, Titel und Zuletzt ("nie" zuerst)', () => {
		expect(nums(sortHymns(rows, { key: 'number', dir: 'desc' }))).toEqual([1001, 12, 5]);
		expect(nums(sortHymns(rows, { key: 'title', dir: 'asc' }))).toEqual([1001, 12, 5]);
		expect(nums(sortHymns(rows, { key: 'lastSung', dir: 'asc' }))).toEqual([12, 5, 1001]);
	});
	it('Dauer: ohne Angabe zuletzt, Anzahl numerisch', () => {
		expect(nums(sortHymns(rows, { key: 'duration', dir: 'asc' }))).toEqual([1001, 5, 12]);
		expect(nums(sortHymns(rows, { key: 'duration', dir: 'desc' }))).toEqual([5, 1001, 12]);
		expect(nums(sortHymns(rows, { key: 'count52', dir: 'desc' }))).toEqual([5, 1001, 12]);
	});
});
