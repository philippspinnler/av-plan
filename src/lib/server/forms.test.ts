import { describe, expect, it, vi } from 'vitest';
import { failMessage, int, optInt, optStr, rawStr, safeNext, str, strList, UserError } from './forms';

const fd = new FormData();
fd.append('name', '  Anna ');
fd.append('n', '42');
fd.append('x', '');
fd.append('list', 'a');
fd.append('list', ' ');
fd.append('list', 'b');
fd.append('password', '  geheim  ');

describe('forms', () => {
	it('reads trimmed strings', () => {
		expect(str(fd, 'name')).toBe('Anna');
		expect(str(fd, 'fehlt')).toBe('');
		expect(optStr(fd, 'x')).toBeNull();
		expect(optStr(fd, 'name')).toBe('Anna');
	});
	it('reads numbers', () => {
		expect(int(fd, 'n')).toBe(42);
		expect(int(fd, 'x')).toBe(0);
		expect(optInt(fd, 'x')).toBeNull();
		expect(optInt(fd, 'n')).toBe(42);
	});
	it('reads lists without empty entries', () => {
		expect(strList(fd, 'list')).toEqual(['a', 'b']);
	});
	it('reads untrimmed strings', () => {
		expect(rawStr(fd, 'password')).toBe('  geheim  ');
		expect(rawStr(fd, 'fehlt')).toBe('');
	});
});

const ORIGIN = 'https://app.example';

describe('safeNext', () => {
	it('keeps paths on our origin', () => {
		expect(safeNext('/sonntag/2026-10-25?tab=musik', ORIGIN)).toBe('/sonntag/2026-10-25?tab=musik');
		expect(safeNext(null, ORIGIN)).toBe('/');
		expect(safeNext('', ORIGIN)).toBe('/');
	});
	it('rejects every form of a foreign destination', () => {
		for (const next of ['//evil.example', '/\\evil.example', '\\\\evil.example', 'https://evil.example/', 'javascript:alert(1)', '/\\\\']) {
			expect(safeNext(next, ORIGIN)).toBe('/');
		}
	});
});

describe('failMessage', () => {
	it('passes our own messages through and hides everything else', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(failMessage(new UserError('Name darf nicht leer sein'))).toBe('Name darf nicht leer sein');
		expect(failMessage(new Error('SQLITE_CONSTRAINT: UNIQUE'))).toBe('Speichern fehlgeschlagen.');
		spy.mockRestore();
	});
});
