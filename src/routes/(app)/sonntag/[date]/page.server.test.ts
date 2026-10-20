import { describe, expect, it } from 'vitest';
import { createDb } from '$lib/server/db';
import type { Role } from '$lib/server/db/schema';
import { createMeeting } from '$lib/server/meetings';
import { createMember } from '$lib/server/members';
import { load } from './+page.server';

const SUNDAY = '2026-10-25';

type Data = Exclude<Awaited<ReturnType<typeof load>>, void>;

function call(role: Role) {
	const db = createDb(':memory:');
	createMember(db, { firstName: 'Olga', lastName: 'Orgel' });
	createMeeting(db, SUNDAY);
	const locals = { db, user: { id: 1, email: 'test@example.org', name: 'Tina Test', role } };
	return load({ locals, params: { date: SUNDAY } } as never) as Data;
}

describe('Sunday page load', () => {
	it('refuses youth-only roles', async () => {
		for (const role of ['jm_berater', 'jd_leitung'] as const) {
			await expect(async () => call(role)).rejects.toMatchObject({ status: 403 });
		}
	});
	it('resolves for every meeting role', async () => {
		for (const role of ['admin', 'bischofschaft', 'gebete', 'musik', 'dirigent'] as const) {
			const data = await call(role);
			expect(data.missing).toBe(false);
		}
	});
});
