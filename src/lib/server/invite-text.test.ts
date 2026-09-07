import { expect, it } from 'vitest';
import { inviteText } from './invite-text';

it('erzeugt einen kopierbaren Einladungstext ohne ß', () => {
	const t = inviteText('Anna', 'https://av.example.ch/einladung/abc');
	expect(t).toContain('Hallo Anna');
	expect(t).toContain('https://av.example.ch/einladung/abc');
	expect(t).toContain('7 Tage');
	expect(t).not.toContain('ß');
});
