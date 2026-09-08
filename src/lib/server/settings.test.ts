import { expect, it } from 'vitest';
import { createDb } from './db';
import { getAllSettings, getSetting, setSetting } from './settings';

it('liefert Defaults und speichert Änderungen', () => {
	const db = createDb(':memory:');
	expect(getSetting(db, 'ward_name')).toBe('Gemeinde');
	setSetting(db, 'ward_name', 'Bern');
	setSetting(db, 'ward_name', 'Bern West');
	expect(getSetting(db, 'ward_name')).toBe('Bern West');
	expect(getAllSettings(db)).toEqual({ ward_name: 'Bern West', bishopric_member_ids: '[]' });
});
