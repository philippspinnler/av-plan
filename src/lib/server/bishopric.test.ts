import { describe, expect, it } from 'vitest';
import { formatAbsences, getBishopricIds, parseAbsences, setBishopricIds } from './bishopric';
import { createDb } from './db';

describe('bishopric', () => {
	it('speichert und liest die Bischofschaft', () => {
		const db = createDb(':memory:');
		expect(getBishopricIds(db)).toEqual([]);
		setBishopricIds(db, [3, 1, 3]);
		expect(getBishopricIds(db)).toEqual([3, 1]);
	});
	it('kodiert Abwesenheiten und erkennt Altdaten', () => {
		expect(formatAbsences([])).toBeNull();
		expect(formatAbsences([2, 5, 2])).toBe('ids:2,5');
		expect(parseAbsences('ids:2,5')).toEqual({ ids: [2, 5], legacy: null });
		expect(parseAbsences('ids:')).toEqual({ ids: [], legacy: null });
		expect(parseAbsences('Urs, Reto')).toEqual({ ids: [], legacy: 'Urs, Reto' });
		expect(parseAbsences(null)).toEqual({ ids: [], legacy: null });
	});
});
