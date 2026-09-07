import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession } from '$lib/server/auth';
import { SESSION_COOKIE, clearSessionCookie } from '$lib/server/cookies';

export const POST: RequestHandler = ({ cookies, locals }) => {
	const sid = cookies.get(SESSION_COOKIE);
	if (sid) deleteSession(locals.db, sid);
	clearSessionCookie(cookies);
	redirect(303, '/login');
};
