import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { userCount, validateSession } from '$lib/server/auth';
import { SESSION_COOKIE, clearSessionCookie, setSessionCookie } from '$lib/server/cookies';
import { ROLE_VIEW_COOKIE, effectiveRole } from '$lib/server/role-view';

const PUBLIC = new Set(['/login', '/setup', '/health']);

export const handle: Handle = async ({ event, resolve }) => {
	const db = getDb();
	event.locals.db = db;
	event.locals.user = null;
	event.locals.accountRole = null;

	const sid = event.cookies.get(SESSION_COOKIE);
	if (sid) {
		const session = validateSession(db, sid);
		if (session) {
			event.locals.accountRole = session.user.role;
			event.locals.user = { ...session.user, role: effectiveRole(session.user.role, event.cookies.get(ROLE_VIEW_COOKIE)) };
			setSessionCookie(event.cookies, sid, session.expiresAt);
		} else {
			clearSessionCookie(event.cookies);
		}
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

export const handleError: HandleServerError = ({ error, status }) => {
	if (status !== 404) console.error(error);
	return { message: 'Ein unerwarteter Fehler ist aufgetreten.' };
};
