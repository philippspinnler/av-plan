import { describe, expect, it } from 'vitest';
import { createDb } from '$lib/server/db';
import type { Role } from '$lib/server/db/schema';
import { ensureYouthEvents, loadYouthEvent, saveYouthCommon, youthSectionVersions } from '$lib/server/youth';
import { actions } from './+page.server';

const WED = '2026-10-21';

function setup(role: Role) {
	const db = createDb(':memory:');
	ensureYouthEvents(db, WED, 0);
	return { db, locals: { db, user: { id: 1, email: 'test@example.org', name: 'Tina Test', role } } };
}

function call(action: keyof typeof actions, locals: unknown, fields: Record<string, string>) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.set(k, v);
	const request = new Request('http://x', { method: 'POST', body: fd });
	return actions[action]({ request, locals, params: { date: WED } } as never);
}

describe('youth event actions', () => {
	it('rejects jd for jm_berater', async () => {
		const { locals } = setup('jm_berater');
		await expect(call('jd', locals, {})).rejects.toMatchObject({ status: 403 });
	});

	it('rejects jm for jd_leitung', async () => {
		const { locals } = setup('jd_leitung');
		await expect(call('jm', locals, {})).rejects.toMatchObject({ status: 403 });
	});

	it('lets jm_berater save the joint part', async () => {
		const { db, locals } = setup('jm_berater');
		const id = loadYouthEvent(db, WED)!.event.id;
		saveYouthCommon(db, id, { kind: 'aktivitaet', joint: true, details: null, topic: null, topicUrl: null, snack: null });
		const version = youthSectionVersions(loadYouthEvent(db, WED)!).both;
		const result = await call('both', locals, { version, text: 'Bowling' });
		expect(result).toEqual({ saved: 'both' });
		expect(loadYouthEvent(db, WED)!.parts[0]).toMatchObject({ side: 'both', text: 'Bowling' });
	});

	it('saves common details with the current version', async () => {
		const { db, locals } = setup('jd_leitung');
		const version = youthSectionVersions(loadYouthEvent(db, WED)!).common;
		const result = await call('common', locals, { version, kind: 'aktivitaet', details: 'Treffpunkt Kirche' });
		expect(result).toEqual({ saved: 'common' });
		expect(loadYouthEvent(db, WED)!.event.details).toBe('Treffpunkt Kirche');
	});
});
