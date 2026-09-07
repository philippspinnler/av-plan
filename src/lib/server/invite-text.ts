export function inviteText(name: string, link: string): string {
	return [
		`Hallo ${name}`,
		'',
		'Ich habe dich für das Abendmahlsversammlungs-Tool eingeladen. Bitte öffne diesen Link und setze dein Passwort:',
		link,
		'',
		'Der Link ist 7 Tage gültig.',
		'',
		'Liebe Grüsse'
	].join('\n');
}
