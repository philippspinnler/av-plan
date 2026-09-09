import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { can } from '$lib/server/permissions';

export const load: PageServerLoad = ({ locals }) => {
	redirect(303, can(locals.user!.role, 'ask.talks') ? '/fragen/ansprachen' : '/fragen/gebete');
};
