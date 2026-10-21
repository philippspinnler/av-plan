import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/permissions';
import { youthList } from '$lib/server/youth-list';

export const load: PageServerLoad = ({ locals, url }) => {
	requireRole(locals.user, 'youth.view');
	return youthList(locals.db, url, 'wednesday');
};
