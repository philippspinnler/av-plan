import { redirect, type Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { userCount, validateSession } from '$lib/server/auth';
import { SESSION_COOKIE, clearSessionCookie } from '$lib/server/cookies';

const PUBLIC = new Set(['/login', '/setup', '/health']);

export const handle: Handle = async ({ event, resolve }) => {
	const db = getDb();
	event.locals.db = db;
	event.locals.user = null;

	const sid = event.cookies.get(SESSION_COOKIE);
	if (sid) {
		const session = validateSession(db, sid);
		if (session) event.locals.user = session.user;
		else clearSessionCookie(event.cookies);
	}

	const path = event.url.pathname;
	if (path === '/health') return resolve(event);
	if (userCount(db) === 0) {
		if (path !== '/setup') redirect(303, '/setup');
		return resolve(event);
	}
	if (path === '/setup') redirect(303, '/');
	const isPublic = PUBLIC.has(path) || path.startsWith('/einladung/');
	if (!event.locals.user && !isPublic) {
		redirect(303, `/login?next=${encodeURIComponent(path)}`);
	}
	return resolve(event);
};
