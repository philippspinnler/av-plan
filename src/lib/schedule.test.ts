import { describe, expect, it } from 'vitest';
import { programOrder } from './schedule';

describe('programOrder', () => {
	it('places the intermediate hymn after the second talk', () => {
		expect(programOrder([1, 2, 3])).toEqual([{ type: 'talk', position: 1 }, { type: 'talk', position: 2 }, { type: 'zwischenlied' }, { type: 'talk', position: 3 }]);
		expect(programOrder([1, 2, 3, 4])).toEqual([{ type: 'talk', position: 1 }, { type: 'talk', position: 2 }, { type: 'zwischenlied' }, { type: 'talk', position: 3 }, { type: 'talk', position: 4 }]);
	});
	it('places it between talks 1 and 2 with two talks, after the talk with one', () => {
		expect(programOrder([1, 2])).toEqual([{ type: 'talk', position: 1 }, { type: 'zwischenlied' }, { type: 'talk', position: 2 }]);
		expect(programOrder([3])).toEqual([{ type: 'talk', position: 3 }, { type: 'zwischenlied' }]);
		expect(programOrder([])).toEqual([{ type: 'zwischenlied' }]);
	});
});
