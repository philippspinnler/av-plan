import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { bookForNumber, createHymn, getHymnByNumber, hymnLabel, listHymns, updateHymn } from './hymns';

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
});

describe('hymns', () => {
	it('derives the book from the number', () => {
		expect(bookForNumber(1)).toBe('gesangbuch');
		expect(bookForNumber(341)).toBe('gesangbuch');
		expect(bookForNumber(1001)).toBe('neu');
	});
	it('creates, lists sorted and prevents duplicates', () => {
		createHymn(db, { number: 1001, title: 'Komm, du Quelle jedes Segens', durationSeconds: 153 });
		createHymn(db, { number: 3, title: ' O Fülle des Heiles ' });
		expect(listHymns(db).map((h) => h.number)).toEqual([3, 1001]);
		expect(getHymnByNumber(db, 3)?.title).toBe('O Fülle des Heiles');
		expect(getHymnByNumber(db, 1001)?.book).toBe('neu');
		expect(() => createHymn(db, { number: 3, title: 'x' })).toThrowError('Nummer existiert bereits');
	});
	it('updates and labels', () => {
		const h = createHymn(db, { number: 5, title: 'Herr, unser Erlöser' });
		updateHymn(db, h.id, { title: 'Herr, unser Erlöser', durationSeconds: 250 });
		expect(getHymnByNumber(db, 5)?.durationSeconds).toBe(250);
		expect(hymnLabel(h)).toBe('5 – Herr, unser Erlöser');
	});
});
