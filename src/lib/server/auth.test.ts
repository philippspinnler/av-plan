import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import {
	acceptInvite, createInvite, createSession, createUser, deleteSession, getValidInvite,
	hashPassword, listOpenInvites, loginWithPassword, userCount, validateSession, verifyPassword
} from './auth';

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
});

describe('Passwörter', () => {
	it('hasht und prüft', async () => {
		const h = await hashPassword('geheim123');
		expect(h).not.toContain('geheim123');
		expect(await verifyPassword(h, 'geheim123')).toBe(true);
		expect(await verifyPassword(h, 'falsch')).toBe(false);
	});
});

describe('Login', () => {
	it('meldet Benutzer an und weist falsche Passwörter ab', async () => {
		expect(userCount(db)).toBe(0);
		await createUser(db, { email: 'Admin@Example.ch', name: 'Admin', role: 'admin', password: 'geheim123' });
		expect(userCount(db)).toBe(1);
		const ok = await loginWithPassword(db, 'admin@example.ch', 'geheim123');
		expect(ok.ok).toBe(true);
		const bad = await loginWithPassword(db, 'admin@example.ch', 'nein');
		expect(bad).toEqual({ ok: false, reason: 'invalid' });
	});
	it('drosselt nach fünf Fehlversuchen', async () => {
		await createUser(db, { email: 'a@b.ch', name: 'A', role: 'admin', password: 'geheim123' });
		const t0 = new Date('2026-09-07T10:00:00Z');
		for (let i = 0; i < 5; i++) {
			await loginWithPassword(db, 'a@b.ch', 'nein', new Date(t0.getTime() + i * 1000));
		}
		const throttled = await loginWithPassword(db, 'a@b.ch', 'geheim123', new Date(t0.getTime() + 10_000));
		expect(throttled).toEqual({ ok: false, reason: 'throttled' });
		const later = await loginWithPassword(db, 'a@b.ch', 'geheim123', new Date(t0.getTime() + 70_000));
		expect(later.ok).toBe(true);
	});
	it('lehnt inaktive Benutzer ab', async () => {
		const u = await createUser(db, { email: 'a@b.ch', name: 'A', role: 'musik', password: 'geheim123' });
		const { setUserActive } = await import('./auth');
		setUserActive(db, u.id, false);
		expect(await loginWithPassword(db, 'a@b.ch', 'geheim123')).toEqual({ ok: false, reason: 'invalid' });
	});
});

describe('Sessions', () => {
	it('erstellt, validiert, verlängert und löscht', async () => {
		const u = await createUser(db, { email: 'a@b.ch', name: 'A', role: 'musik', password: 'geheim123' });
		const t0 = new Date('2026-09-07T10:00:00Z');
		const s = createSession(db, u.id, t0);
		const v = validateSession(db, s.id, t0);
		expect(v?.user).toEqual({ id: u.id, email: 'a@b.ch', name: 'A', role: 'musik' });
		const t20 = new Date(t0.getTime() + 20 * 86_400_000);
		const v2 = validateSession(db, s.id, t20);
		expect(v2).not.toBeNull();
		expect(v2!.expiresAt > s.expiresAt).toBe(true);
		const t40 = new Date(t0.getTime() + 60 * 86_400_000);
		expect(validateSession(db, s.id, t40)).toBeNull();
		deleteSession(db, s.id);
		expect(validateSession(db, s.id, t0)).toBeNull();
	});
});

describe('Invites', () => {
	it('erstellt und löst Einladung ein', async () => {
		const admin = await createUser(db, { email: 'a@b.ch', name: 'A', role: 'admin', password: 'geheim123' });
		const t0 = new Date('2026-09-07T10:00:00Z');
		const inv = createInvite(db, { email: 'M@b.ch', name: 'Musik', role: 'musik', createdBy: admin.id }, t0);
		expect(inv.token).toHaveLength(64);
		expect(listOpenInvites(db, t0)).toHaveLength(1);
		expect(getValidInvite(db, inv.token, t0)?.email).toBe('m@b.ch');
		const user = await acceptInvite(db, inv.token, 'passwort1', t0);
		expect(user?.role).toBe('musik');
		expect(getValidInvite(db, inv.token, t0)).toBeNull();
		expect(listOpenInvites(db, t0)).toHaveLength(0);
	});
	it('lehnt abgelaufene Einladungen ab', async () => {
		const admin = await createUser(db, { email: 'a@b.ch', name: 'A', role: 'admin', password: 'geheim123' });
		const t0 = new Date('2026-09-07T10:00:00Z');
		const inv = createInvite(db, { email: 'm@b.ch', name: 'M', role: 'musik', createdBy: admin.id }, t0);
		const t8 = new Date(t0.getTime() + 8 * 86_400_000);
		expect(getValidInvite(db, inv.token, t8)).toBeNull();
		expect(await acceptInvite(db, inv.token, 'passwort1', t8)).toBeNull();
	});
});
