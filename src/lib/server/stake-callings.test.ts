import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { createMember } from './members';
import { createStakeCalling, deleteStakeCalling, ensureStakeCalling, listStakeCallings, moveStakeCalling, renameStakeCalling } from './stake-callings';

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
});

describe('stake callings', () => {
	it('werden durch die Migration vorbelegt und sind sortiert', () => {
		expect(listStakeCallings(db).map((c) => c.name)).toEqual([
			'Pfahlpräsident',
			'1. Ratgeber Pfahlpräsidentschaft',
			'2. Ratgeber Pfahlpräsidentschaft',
			'Hoherat',
			'Missionspräsident'
		]);
	});
	it('legt an, verhindert Duplikate und benennt um', () => {
		const c = createStakeCalling(db, ' Tempelpräsident ');
		expect(c.name).toBe('Tempelpräsident');
		expect(() => createStakeCalling(db, 'hoherat')).toThrowError('Berufung existiert bereits');
		expect(ensureStakeCalling(db, 'Hoherat').name).toBe('Hoherat');
		renameStakeCalling(db, c.id, 'Tempelpräsidentschaft');
		expect(listStakeCallings(db).at(-1)?.name).toBe('Tempelpräsidentschaft');
		expect(() => renameStakeCalling(db, c.id, 'Hoherat')).toThrowError('Berufung existiert bereits');
	});
	it('löscht nur unbenutzte Berufungen', () => {
		const hr = ensureStakeCalling(db, 'Hoherat');
		createMember(db, { firstName: 'Daniel', lastName: 'Dürst', kind: 'pfahl', stakeCallingId: hr.id });
		expect(deleteStakeCalling(db, hr.id)).toBe(false);
		const mp = ensureStakeCalling(db, 'Missionspräsident');
		expect(deleteStakeCalling(db, mp.id)).toBe(true);
		expect(listStakeCallings(db).map((c) => c.name)).not.toContain('Missionspräsident');
	});
	it('verschiebt in der Reihenfolge', () => {
		const hr = ensureStakeCalling(db, 'Hoherat');
		moveStakeCalling(db, hr.id, -1);
		expect(listStakeCallings(db).map((c) => c.name).indexOf('Hoherat')).toBe(2);
		moveStakeCalling(db, hr.id, 1);
		expect(listStakeCallings(db).map((c) => c.name).indexOf('Hoherat')).toBe(3);
	});
});
