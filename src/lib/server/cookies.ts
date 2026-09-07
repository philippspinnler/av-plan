import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE = 'session';

export function setSessionCookie(cookies: Cookies, id: string, expiresAt: string): void {
	cookies.set(SESSION_COOKIE, id, { path: '/', httpOnly: true, sameSite: 'lax', expires: new Date(expiresAt) });
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
