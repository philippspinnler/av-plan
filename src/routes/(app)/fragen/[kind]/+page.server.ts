import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { todayIso } from '$lib/dates';
import { optStr } from '$lib/server/forms';
import { askTables } from '$lib/server/fragen';
import { getMember, updateMember } from '$lib/server/members';
import { can, requireRole } from '$lib/server/permissions';

const KINDS = {
	ansprachen: { title: 'Ansprachen', column: 'Letzte Ansprache', hint: 'Mitglieder, die keine Ansprache halten möchten, sind ausgeblendet.', action: 'ask.talks' as const, noteAction: 'notes.talk' as const, noteField: 'noteTalk' as const },
	gebete: { title: 'Gebete', column: 'Letztes Gebet', hint: 'Mitglieder, die kein Gebet sprechen möchten, sind ausgeblendet. Pfahlbeamte werden nicht ums Gebet gebeten.', action: 'ask.prayers' as const, noteAction: 'notes.prayer' as const, noteField: 'notePrayer' as const }
} as const;

function kindOf(param: string) {
	if (!(param in KINDS)) error(404, 'Seite nicht gefunden');
	return KINDS[param as keyof typeof KINDS];
}

export const load: PageServerLoad = ({ locals, params }) => {
	const k = kindOf(params.kind);
	requireRole(locals.user, k.action);
	const tables = askTables(locals.db, todayIso());
	return { title: k.title, column: k.column, hint: k.hint, canNote: can(locals.user!.role, k.noteAction), rows: params.kind === 'ansprachen' ? tables.talks : tables.prayers };
};

export const actions: Actions = {
	note: async ({ request, locals, params }) => {
		const k = kindOf(params.kind);
		requireRole(locals.user, k.noteAction);
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!getMember(locals.db, id)) return fail(404, { error: 'Mitglied nicht gefunden' });
		updateMember(locals.db, id, { [k.noteField]: optStr(fd, 'note') });
		return { saved: true };
	}
};
