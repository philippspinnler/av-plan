import { describe, expect, it } from 'vitest';
import { programOrder } from './schedule';

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
