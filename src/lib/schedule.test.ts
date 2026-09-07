import { describe, expect, it } from 'vitest';
import { addMinutes, computeTimes, hymnMinutes, programOrder } from './schedule';

describe('programOrder', () => {
	it('setzt das Zwischenlied nach der zweiten Ansprache', () => {
		expect(programOrder([1, 2, 3])).toEqual([{ type: 'talk', position: 1 }, { type: 'talk', position: 2 }, { type: 'zwischenlied' }, { type: 'talk', position: 3 }]);
		expect(programOrder([1, 2, 3, 4])).toEqual([{ type: 'talk', position: 1 }, { type: 'talk', position: 2 }, { type: 'zwischenlied' }, { type: 'talk', position: 3 }, { type: 'talk', position: 4 }]);
	});
	it('setzt es bei zwei Ansprachen zwischen 1 und 2, bei einer danach', () => {
		expect(programOrder([1, 2])).toEqual([{ type: 'talk', position: 1 }, { type: 'zwischenlied' }, { type: 'talk', position: 2 }]);
		expect(programOrder([3])).toEqual([{ type: 'talk', position: 3 }, { type: 'zwischenlied' }]);
		expect(programOrder([])).toEqual([{ type: 'zwischenlied' }]);
	});
});

describe('computeTimes', () => {
	it('rechnet Zeitfenster fortlaufend', () => {
		const items = programOrder([1, 2, 3]);
		const t = computeTimes('10:20', items, new Map([[1, 5], [2, 10], [3, 15]]), 5);
		expect(t.map((x) => [x.start, x.end])).toEqual([['10:20', '10:25'], ['10:25', '10:35'], ['10:35', '10:40'], ['10:40', '10:55']]);
	});
	it('bricht ab, sobald eine Dauer fehlt', () => {
		const t = computeTimes('10:20', programOrder([1, 2, 3]), new Map([[1, 5], [2, null], [3, 15]]), 4);
		expect(t.map((x) => x.start)).toEqual(['10:20', '10:25', null, null]);
	});
	it('liefert nur null ohne Startzeit', () => {
		expect(computeTimes(null, programOrder([1]), new Map([[1, 5]]), 4).every((x) => x.start === null)).toBe(true);
	});
	it('addMinutes und hymnMinutes', () => {
		expect(addMinutes('10:55', 10)).toBe('11:05');
		expect(hymnMinutes(250)).toBe(5);
		expect(hymnMinutes(240)).toBe(4);
		expect(hymnMinutes(null)).toBe(4);
	});
});
