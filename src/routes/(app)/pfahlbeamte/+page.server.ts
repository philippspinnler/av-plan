import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** The list moved to the settings. */
export const load: PageServerLoad = ({ url }) => {
	redirect(301, `/einstellungen/pfahlbeamte${url.search}`);
};
