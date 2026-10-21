import { expect, it } from 'vitest';
import { inviteText, resetText } from './invite-text';

it('produces a copyable invite text with the role and without ß', () => {
	const t = inviteText('Anna', 'https://av.example.ch/einladung/abc', 'musik');
	expect(t).toContain('Hallo Anna');
	expect(t).toContain('Deine Rolle: Musik.');
	expect(t).toContain('https://av.example.ch/einladung/abc');
	expect(t).toContain('7 Tage');
	expect(t).not.toContain('ß');
});

it('produces a reset text', () => {
	expect(resetText('Anna', 'https://av.example.ch/einladung/abc')).toContain('neues Passwort');
});
