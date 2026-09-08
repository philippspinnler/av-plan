import { describe, expect, it } from 'vitest';
import { effectiveRole } from './role-view';

describe('effectiveRole', () => {
	it('admin mit gültiger Testrolle sieht diese Rolle', () => {
		expect(effectiveRole('admin', 'musik')).toBe('musik');
	});
	it('admin mit ungültigem Cookie-Wert bleibt admin', () => {
		expect(effectiveRole('admin', 'bogus')).toBe('admin');
	});
	it('nicht-admin ignoriert den Cookie', () => {
		expect(effectiveRole('bischofschaft', 'admin')).toBe('bischofschaft');
	});
	it('admin ohne Cookie bleibt admin', () => {
		expect(effectiveRole('admin', undefined)).toBe('admin');
	});
});
