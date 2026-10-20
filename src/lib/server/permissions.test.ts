import { describe, expect, it } from 'vitest';
import { can, requireRole, roleLabel } from './permissions';

const ACTIONS = [
	'program.view', 'meeting.view', 'meeting.program', 'meeting.prayers', 'meeting.music', 'meeting.conductor', 'meetings.create',
	'hymns.view', 'hymns.edit', 'members.view', 'members.create', 'members.edit', 'members.stats', 'ask.talks', 'ask.prayers', 'notes.talk', 'notes.prayer', 'users.manage', 'settings.edit',
	'youth.view', 'youth.jm', 'youth.jd', 'youth.common'
] as const;

describe('can', () => {
	it('youth: bishopric edits JM only, JD-Präsidentschaft edits JD only, both see everything', () => {
		for (const r of ['admin', 'bischofschaft', 'jm_berater', 'jd_leitung'] as const) expect(can(r, 'youth.view')).toBe(true);
		expect(can('bischofschaft', 'youth.jm')).toBe(true);
		expect(can('bischofschaft', 'youth.jd')).toBe(false);
		expect(can('jm_berater', 'youth.jd')).toBe(false);
		expect(can('jd_leitung', 'youth.jd')).toBe(true);
		expect(can('jd_leitung', 'youth.jm')).toBe(false);
		expect(can('jd_leitung', 'youth.common')).toBe(true);
		expect(can('gebete', 'youth.view')).toBe(false);
		expect(can('musik', 'youth.common')).toBe(false);
		expect(roleLabel('jd_leitung')).toBe('JD-Präsidentschaft');
	});
	it('member and Sunday pages are closed to roles outside their scope', () => {
		for (const r of ['admin', 'bischofschaft', 'gebete'] as const) expect(can(r, 'members.view')).toBe(true);
		for (const r of ['musik', 'dirigent', 'jm_berater', 'jd_leitung'] as const) expect(can(r, 'members.view')).toBe(false);
		for (const r of ['admin', 'bischofschaft', 'gebete', 'musik', 'dirigent'] as const) expect(can(r, 'meeting.view')).toBe(true);
		for (const r of ['jm_berater', 'jd_leitung'] as const) expect(can(r, 'meeting.view')).toBe(false);
	});
	it('admin may do everything', () => {
		for (const a of ACTIONS) expect(can('admin', a)).toBe(true);
	});
	it('bishopric plans program and music, but no users/settings and edits no people', () => {
		expect(can('bischofschaft', 'program.view')).toBe(true);
		expect(can('bischofschaft', 'meeting.program')).toBe(true);
		expect(can('bischofschaft', 'meeting.music')).toBe(true);
		expect(can('bischofschaft', 'meeting.conductor')).toBe(true);
		expect(can('bischofschaft', 'meetings.create')).toBe(true);
		expect(can('bischofschaft', 'hymns.edit')).toBe(true);
		expect(can('bischofschaft', 'members.stats')).toBe(true);
		expect(can('bischofschaft', 'members.create')).toBe(false);
		expect(can('bischofschaft', 'members.edit')).toBe(false);
		expect(can('bischofschaft', 'notes.talk')).toBe(true);
		expect(can('bischofschaft', 'notes.prayer')).toBe(true);
		expect(can('bischofschaft', 'users.manage')).toBe(false);
		expect(can('bischofschaft', 'settings.edit')).toBe(false);
	});
	it('prayers role enters prayers only and sees the prayer asks, nothing else of the program', () => {
		expect(can('gebete', 'meeting.prayers')).toBe(true);
		expect(can('gebete', 'ask.prayers')).toBe(true);
		expect(can('gebete', 'ask.talks')).toBe(false);
		expect(can('gebete', 'notes.prayer')).toBe(true);
		expect(can('gebete', 'notes.talk')).toBe(false);
		expect(can('musik', 'notes.prayer')).toBe(false);
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
	it('music role maintains music only, sees no program', () => {
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
	it('conductor sets only the conducting field', () => {
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
	it('throws 401 without user and 403 without permission', () => {
		expect(() => requireRole(null, 'meeting.music')).toThrowError(expect.objectContaining({ status: 401 }));
		expect(() => requireRole({ role: 'musik' }, 'meeting.program')).toThrowError(expect.objectContaining({ status: 403 }));
		expect(() => requireRole({ role: 'musik' }, 'meeting.music')).not.toThrow();
	});
});

describe('roleLabel', () => {
	it('returns German labels for all roles', () => {
		expect(roleLabel('admin')).toBe('Admin');
		expect(roleLabel('bischofschaft')).toBe('Bischofschaft');
		expect(roleLabel('musik')).toBe('Musik');
		expect(roleLabel('dirigent')).toBe('Dirigent/in');
	});
});
