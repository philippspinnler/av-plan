import type { Role } from './server/db/schema';

export const ROLE_LABELS: Record<Role, string> = {
	admin: 'Admin',
	bischofschaft: 'Bischofschaft',
	gebete: 'Gebete',
	musik: 'Musik',
	dirigent: 'Dirigent/in',
	jm_berater: 'JM-Berater',
	jd_leitung: 'JD-Präsidentschaft'
};

/** One sentence per role, shown in the invitation and on the invitation page. */
export const ROLE_HELP: Record<Role, string> = {
	admin: 'Du siehst und bearbeitest alles und verwaltest Mitglieder, Benutzer und Einstellungen.',
	bischofschaft: 'Du planst die Abendmahlsversammlungen (Ansprachen, Gebete, Begrüssung, Beamtenänderungen), druckst den Leitungszettel und siehst die Jugendtermine.',
	gebete: 'Du trägst ein, wer die Gebete spricht, und siehst unter Anfragen, wer als Nächstes dran ist.',
	musik: 'Du planst die Lieder und musikalischen Darbietungen der Abendmahlsversammlung und pflegst die Liederliste.',
	dirigent: 'Du siehst Programm und Lieder der kommenden Sonntage und trägst ein, wer dirigiert.',
	jm_berater: 'Du planst die Mittwochaktivitäten und Sonntagsklassen der Jungen Männer und erfasst Ideen und Ausfälle.',
	jd_leitung: 'Du planst die Mittwochaktivitäten und Sonntagsklassen der Jungen Damen und erfasst Ideen und Ausfälle.'
};
