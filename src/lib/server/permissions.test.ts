import { describe, expect, it } from 'vitest';
import { can, requireRole } from './permissions';

describe('can', () => {
	it('admin darf alles', () => {
		for (const a of ['meeting.program', 'meeting.music', 'meetings.create', 'hymns.edit', 'members.create', 'members.edit', 'members.stats', 'users.manage', 'settings.edit'] as const) {
			expect(can('admin', a)).toBe(true);
		}
	});
	it('bischofschaft plant Programm, aber keine Musik und keine Benutzer', () => {
		expect(can('bischofschaft', 'meeting.program')).toBe(true);
		expect(can('bischofschaft', 'meetings.create')).toBe(true);
		expect(can('bischofschaft', 'members.create')).toBe(true);
		expect(can('bischofschaft', 'members.stats')).toBe(true);
		expect(can('bischofschaft', 'meeting.music')).toBe(false);
		expect(can('bischofschaft', 'hymns.edit')).toBe(false);
		expect(can('bischofschaft', 'members.edit')).toBe(false);
		expect(can('bischofschaft', 'users.manage')).toBe(false);
	});
	it('musik pflegt nur Musik', () => {
		expect(can('musik', 'meeting.music')).toBe(true);
		expect(can('musik', 'hymns.edit')).toBe(true);
		expect(can('musik', 'meeting.program')).toBe(false);
		expect(can('musik', 'members.stats')).toBe(false);
		expect(can('musik', 'members.create')).toBe(false);
	});
});

describe('requireRole', () => {
	it('wirft 401 ohne Benutzer und 403 bei fehlendem Recht', () => {
		expect(() => requireRole(null, 'meeting.music')).toThrowError(expect.objectContaining({ status: 401 }));
		expect(() => requireRole({ role: 'musik' }, 'meeting.program')).toThrowError(expect.objectContaining({ status: 403 }));
		expect(() => requireRole({ role: 'musik' }, 'meeting.music')).not.toThrow();
	});
});
