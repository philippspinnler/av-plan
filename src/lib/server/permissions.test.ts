import { describe, expect, it } from 'vitest';
import { can, requireRole, roleLabel } from './permissions';

const ACTIONS = [
	'program.view', 'meeting.program', 'meeting.prayers', 'meeting.music', 'meeting.conductor', 'meetings.create',
	'hymns.view', 'hymns.edit', 'members.create', 'members.edit', 'members.stats', 'ask.talks', 'ask.prayers', 'users.manage', 'settings.edit'
] as const;

describe('can', () => {
	it('admin darf alles', () => {
		for (const a of ACTIONS) expect(can('admin', a)).toBe(true);
	});
	it('bischofschaft plant Programm und Musik, aber keine Benutzer/Einstellungen und ändert keine Personen', () => {
		expect(can('bischofschaft', 'program.view')).toBe(true);
		expect(can('bischofschaft', 'meeting.program')).toBe(true);
		expect(can('bischofschaft', 'meeting.music')).toBe(true);
		expect(can('bischofschaft', 'meeting.conductor')).toBe(true);
		expect(can('bischofschaft', 'meetings.create')).toBe(true);
		expect(can('bischofschaft', 'hymns.edit')).toBe(true);
		expect(can('bischofschaft', 'members.stats')).toBe(true);
		expect(can('bischofschaft', 'members.create')).toBe(false);
		expect(can('bischofschaft', 'members.edit')).toBe(false);
		expect(can('bischofschaft', 'users.manage')).toBe(false);
		expect(can('bischofschaft', 'settings.edit')).toBe(false);
	});
	it('gebete trägt nur Gebete ein und sieht die Gebete-Fragen, sonst nichts vom Programm', () => {
		expect(can('gebete', 'meeting.prayers')).toBe(true);
		expect(can('gebete', 'ask.prayers')).toBe(true);
		expect(can('gebete', 'ask.talks')).toBe(false);
		expect(can('gebete', 'program.view')).toBe(false);
		expect(can('gebete', 'meeting.program')).toBe(false);
		expect(can('gebete', 'meeting.music')).toBe(false);
		expect(can('gebete', 'hymns.view')).toBe(false);
		expect(can('dirigent', 'hymns.view')).toBe(true);
		expect(can('gebete', 'members.stats')).toBe(false);
		expect(can('gebete', 'settings.edit')).toBe(false);
		expect(can('bischofschaft', 'meeting.prayers')).toBe(true);
		expect(can('bischofschaft', 'ask.talks')).toBe(true);
		expect(can('musik', 'meeting.prayers')).toBe(false);
	});
	it('musik pflegt nur Musik, sieht kein Programm', () => {
		expect(can('musik', 'meeting.music')).toBe(true);
		expect(can('musik', 'meeting.conductor')).toBe(true);
		expect(can('musik', 'hymns.edit')).toBe(true);
		expect(can('musik', 'program.view')).toBe(false);
		expect(can('musik', 'meeting.program')).toBe(false);
		expect(can('musik', 'meetings.create')).toBe(false);
		expect(can('musik', 'members.stats')).toBe(false);
		expect(can('musik', 'members.create')).toBe(false);
		expect(can('musik', 'members.edit')).toBe(false);
		expect(can('musik', 'users.manage')).toBe(false);
		expect(can('musik', 'settings.edit')).toBe(false);
	});
	it('dirigent setzt nur das Dirigieren-Feld', () => {
		expect(can('dirigent', 'meeting.conductor')).toBe(true);
		expect(can('dirigent', 'meeting.music')).toBe(false);
		expect(can('dirigent', 'hymns.edit')).toBe(false);
		expect(can('dirigent', 'program.view')).toBe(false);
		expect(can('dirigent', 'meeting.program')).toBe(false);
		expect(can('dirigent', 'meetings.create')).toBe(false);
		expect(can('dirigent', 'members.stats')).toBe(false);
		expect(can('dirigent', 'members.create')).toBe(false);
		expect(can('dirigent', 'members.edit')).toBe(false);
		expect(can('dirigent', 'users.manage')).toBe(false);
		expect(can('dirigent', 'settings.edit')).toBe(false);
	});
});

describe('requireRole', () => {
	it('wirft 401 ohne Benutzer und 403 bei fehlendem Recht', () => {
		expect(() => requireRole(null, 'meeting.music')).toThrowError(expect.objectContaining({ status: 401 }));
		expect(() => requireRole({ role: 'musik' }, 'meeting.program')).toThrowError(expect.objectContaining({ status: 403 }));
		expect(() => requireRole({ role: 'musik' }, 'meeting.music')).not.toThrow();
	});
});

describe('roleLabel', () => {
	it('liefert deutsche Bezeichnungen für alle Rollen', () => {
		expect(roleLabel('admin')).toBe('Admin');
		expect(roleLabel('bischofschaft')).toBe('Bischofschaft');
		expect(roleLabel('musik')).toBe('Musik');
		expect(roleLabel('dirigent')).toBe('Dirigent/in');
	});
});
