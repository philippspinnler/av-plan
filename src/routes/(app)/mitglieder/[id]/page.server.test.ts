import { describe, expect, it } from 'vitest';
import { createDb } from '$lib/server/db';
import type { Role } from '$lib/server/db/schema';
import { createMember } from '$lib/server/members';
import { load } from './+page.server';

type Data = Exclude<Awaited<ReturnType<typeof load>>, void>;

function call(role: Role) {
	const db = createDb(':memory:');
	const m = createMember(db, { firstName: 'Mia', lastName: 'Muster', noTalk: true });
	const locals = { db, user: { id: 1, email: 'test@example.org', name: 'Tina Test', role } };
	return load({ locals, params: { id: String(m.id) } } as never) as Data;
}

describe('member page load', () => {
	it('refuses roles without members.view', async () => {
		for (const role of ['dirigent', 'musik', 'jm_berater', 'jd_leitung'] as const) {
			await expect(async () => call(role)).rejects.toMatchObject({ status: 403 });
		}
	});
	it('shows the member to the prayers role without notes', async () => {
		const data = await call('gebete');
		expect(data.member.lastName).toBe('Muster');
		expect(data.member.noteTalk).toBeNull();
	});
});
