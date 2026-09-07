import { expect, it } from 'vitest';
import { leadingInt } from './hymn-input';

it('liest die führende Nummer', () => {
	expect(leadingInt('202 – Ich bin ein Kind von Gott')).toBe(202);
	expect(leadingInt(' 56')).toBe(56);
	expect(leadingInt('Felsen')).toBeNull();
	expect(leadingInt('')).toBeNull();
});
