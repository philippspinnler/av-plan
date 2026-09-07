import { expect, it } from 'vitest';
import { createDb } from './db';
import { getAllSettings, getSetting, setSetting } from './settings';

it('liefert Defaults und speichert Änderungen', () => {
	const db = createDb(':memory:');
	expect(getSetting(db, 'talks_start_time_default')).toBe('10:20');
	setSetting(db, 'talks_start_time_default', '10:15');
	setSetting(db, 'talks_start_time_default', '10:10');
	expect(getSetting(db, 'talks_start_time_default')).toBe('10:10');
	expect(getAllSettings(db)).toEqual({ talks_start_time_default: '10:10', meeting_start_time: '09:30', ward_name: 'Gemeinde' });
});
