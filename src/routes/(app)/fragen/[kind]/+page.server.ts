import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { todayIso } from '$lib/dates';
import { askTables } from '$lib/server/fragen';
import { requireRole } from '$lib/server/permissions';

const KINDS = {
	ansprachen: { title: 'Ansprachen', column: 'Letzte Ansprache', hint: 'Mitglieder, die keine Ansprache halten möchten, sind ausgeblendet.', action: 'ask.talks' as const },
	gebete: { title: 'Gebete', column: 'Letztes Gebet', hint: 'Mitglieder, die kein Gebet sprechen möchten, sind ausgeblendet. Pfahlbeamte werden nicht ums Gebet gebeten.', action: 'ask.prayers' as const }
} as const;

export const load: PageServerLoad = ({ locals, params }) => {
	const kind = params.kind as keyof typeof KINDS;
	if (!(kind in KINDS)) error(404, 'Seite nicht gefunden');
	requireRole(locals.user, KINDS[kind].action);
	const tables = askTables(locals.db, todayIso());
	return { ...KINDS[kind], rows: kind === 'ansprachen' ? tables.talks : tables.prayers };
};
