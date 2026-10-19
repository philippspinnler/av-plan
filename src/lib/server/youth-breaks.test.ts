import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { youthBreaks } from './db/schema';
import { breakFor, listBreaks } from './youth-breaks';

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
	db.insert(youthBreaks).values([
		{ fromDate: '2026-12-21', toDate: '2027-01-03', label: 'Weihnachtsferien', kind: 'ferien' },
		{ fromDate: '2026-10-05', toDate: '2026-10-16', label: 'Herbstferien', kind: 'ferien' }
	]).run();
});

describe('youth breaks', () => {
	it('listBreaks filters by end date', () => {
		expect(listBreaks(db).map((b) => b.label)).toEqual(['Herbstferien', 'Weihnachtsferien']);
		expect(listBreaks(db, '2026-10-17').map((b) => b.label)).toEqual(['Weihnachtsferien']);
		expect(listBreaks(db, '2026-10-16').map((b) => b.label)).toEqual(['Herbstferien', 'Weihnachtsferien']);
	});
	it('breakFor picks the containing range', () => {
		const all = listBreaks(db);
		expect(breakFor(all, '2026-10-14')?.label).toBe('Herbstferien');
		expect(breakFor(all, '2027-01-03')?.label).toBe('Weihnachtsferien');
		expect(breakFor(all, '2026-10-17')).toBeNull();
	});
});
