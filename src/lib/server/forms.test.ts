import { describe, expect, it } from 'vitest';
import { int, optInt, optStr, rawStr, str, strList } from './forms';

const fd = new FormData();
fd.append('name', '  Anna ');
fd.append('n', '42');
fd.append('x', '');
fd.append('list', 'a');
fd.append('list', ' ');
fd.append('list', 'b');
fd.append('password', '  geheim  ');

describe('forms', () => {
	it('liest Strings getrimmt', () => {
		expect(str(fd, 'name')).toBe('Anna');
		expect(str(fd, 'fehlt')).toBe('');
		expect(optStr(fd, 'x')).toBeNull();
		expect(optStr(fd, 'name')).toBe('Anna');
	});
	it('liest Zahlen', () => {
		expect(int(fd, 'n')).toBe(42);
		expect(int(fd, 'x')).toBe(0);
		expect(optInt(fd, 'x')).toBeNull();
		expect(optInt(fd, 'n')).toBe(42);
	});
	it('liest Listen ohne Leereinträge', () => {
		expect(strList(fd, 'list')).toEqual(['a', 'b']);
	});
	it('liest Strings ungetrimmt', () => {
		expect(rawStr(fd, 'password')).toBe('  geheim  ');
		expect(rawStr(fd, 'fehlt')).toBe('');
	});
});
