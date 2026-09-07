import { expect, it } from 'vitest';
import { formatDuration, parseDuration } from './duration';

it('parst und formatiert mm:ss', () => {
	expect(parseDuration('4:10')).toBe(250);
	expect(parseDuration(' 0:45 ')).toBe(45);
	expect(parseDuration('250')).toBe(250);
	expect(parseDuration('')).toBeNull();
	expect(parseDuration('abc')).toBeNull();
	expect(formatDuration(250)).toBe('4:10');
	expect(formatDuration(5)).toBe('0:05');
	expect(formatDuration(null)).toBe('');
});
