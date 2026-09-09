import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Die Benutzerverwaltung ist in die Einstellungen umgezogen. */
export const load: PageServerLoad = ({ url }) => {
	redirect(301, `/einstellungen/benutzer${url.search}`);
};
