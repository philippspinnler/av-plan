import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formatDateDe } from '$lib/dates';
import { optStr, str } from '$lib/server/forms';
import { displayName, getMember, updateMember } from '$lib/server/members';
import { can, requireRole } from '$lib/server/permissions';
import { memberHistory } from '$lib/server/stats';

export const load: PageServerLoad = ({ locals, params }) => {
	const member = getMember(locals.db, Number(params.id));
	if (!member) error(404, 'Person nicht gefunden');
	const role = locals.user!.role;
	const stats = can(role, 'members.stats');
	return {
		member,
		title: displayName(member),
		canEdit: can(role, 'members.edit'),
		stats,
		history: stats
			? memberHistory(locals.db, member.id).map((h) => ({
					date: h.date,
					dateLabel: formatDateDe(h.date),
					what: h.kind === 'talk' ? `Ansprache ${h.position}` : h.position === 1 ? 'Anfangsgebet' : 'Schlussgebet',
					topic: h.topic
				}))
			: []
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		requireRole(locals.user, 'members.edit');
		const fd = await request.formData();
		const firstName = str(fd, 'firstName');
		if (!firstName) return fail(400, { error: 'Der Vorname darf nicht leer sein.' });
		updateMember(locals.db, Number(params.id), {
			firstName,
			lastName: str(fd, 'lastName'),
			affiliation: optStr(fd, 'affiliation'),
			active: str(fd, 'active') === '1',
			noteTalk: optStr(fd, 'noteTalk'),
			notePrayer: optStr(fd, 'notePrayer')
		});
		return { saved: true };
	}
};
