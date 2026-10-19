import { describe, expect, it } from 'vitest';
import { effectiveRole } from './role-view';

describe('effectiveRole', () => {
	it('admin with a valid test role sees that role', () => {
		expect(effectiveRole('admin', 'musik')).toBe('musik');
	});
	it('admin with an invalid cookie value stays admin', () => {
		expect(effectiveRole('admin', 'bogus')).toBe('admin');
	});
	it('non-admin ignores the cookie', () => {
		expect(effectiveRole('bischofschaft', 'admin')).toBe('bischofschaft');
	});
	it('admin without cookie stays admin', () => {
		expect(effectiveRole('admin', undefined)).toBe('admin');
	});
});
