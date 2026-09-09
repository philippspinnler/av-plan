import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { can } from '$lib/server/permissions';

export const load: LayoutServerLoad = ({ locals }) => {
	const role = locals.user!.role;
	const tabs = [
		...(can(role, 'ask.talks') ? [{ href: '/fragen/ansprachen', label: 'Ansprachen' }] : []),
		...(can(role, 'ask.prayers') ? [{ href: '/fragen/gebete', label: 'Gebete' }] : [])
	];
	if (!tabs.length) error(403, 'Dafür fehlt dir die Berechtigung');
	return { tabs };
};
