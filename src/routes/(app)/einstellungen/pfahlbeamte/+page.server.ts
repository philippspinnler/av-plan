import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { optInt, str } from '$lib/server/forms';
import { createMember, listMembers } from '$lib/server/members';
import { listStakeCallings } from '$lib/server/stake-callings';
import { can, requireRole } from '$lib/server/permissions';

export const load: PageServerLoad = ({ locals, url }) => {
	const showAll = url.searchParams.get('alle') === '1';
	const officers = listMembers(locals.db, { activeOnly: !showAll, kind: 'pfahl' }).map((m) => ({
		id: m.id,
		name: `${m.firstName} ${m.lastName}`.trim(),
		calling: m.calling ?? '',
		active: m.active
	}));
	return { officers, showAll, canCreate: can(locals.user!.role, 'members.create'), callings: listStakeCallings(locals.db).map((c) => ({ id: c.id, name: c.name })) };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireRole(locals.user, 'members.create');
		const fd = await request.formData();
		const firstName = str(fd, 'firstName');
		const lastName = str(fd, 'lastName');
		if (!firstName) return fail(400, { error: 'Bitte mindestens einen Vornamen angeben.' });
		const m = createMember(locals.db, { firstName, lastName, kind: 'pfahl', stakeCallingId: optInt(fd, 'stakeCallingId') });
		redirect(303, `/mitglieder/${m.id}`);
	}
};
