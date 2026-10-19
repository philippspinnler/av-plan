import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** User management moved to the settings. */
export const load: PageServerLoad = ({ url }) => {
	redirect(301, `/einstellungen/benutzer${url.search}`);
};
