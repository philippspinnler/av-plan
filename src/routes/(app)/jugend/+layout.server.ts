import type { LayoutServerLoad } from './$types';
import { requireRole } from '$lib/server/permissions';
import { getSetting } from '$lib/server/settings';

export const load: LayoutServerLoad = ({ locals }) => {
	requireRole(locals.user, 'youth.view');
	return { youthToken: getSetting(locals.db, 'youth_page_token') };
};
