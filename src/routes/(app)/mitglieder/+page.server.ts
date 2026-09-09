import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Die Liste ist in die Einstellungen umgezogen. */
export const load: PageServerLoad = ({ url }) => {
	redirect(301, `/einstellungen/mitglieder${url.search}`);
};
