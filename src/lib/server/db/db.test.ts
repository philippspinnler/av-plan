import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from './index';

describe('createDb', () => {
	it('legt alle Tabellen an und aktiviert Fremdschlüssel', () => {
		const db = createDb(':memory:');
		const rows = db.all<{ name: string }>(sql`select name from sqlite_master where type = 'table'`);
		const names = rows.map((r) => r.name);
		for (const t of [
			'users', 'sessions', 'invites', 'login_attempts', 'members', 'hymns', 'meetings',
			'meeting_prayers', 'meeting_talks', 'meeting_hymns', 'announcements', 'callings', 'settings'
		]) {
			expect(names).toContain(t);
		}
		const fk = db.get<{ foreign_keys: number }>(sql`pragma foreign_keys`);
		expect(fk?.foreign_keys).toBe(1);
	});
});
