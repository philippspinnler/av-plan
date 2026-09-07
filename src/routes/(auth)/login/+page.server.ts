import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, loginWithPassword, pruneLoginAttempts } from '$lib/server/auth';
import { setSessionCookie } from '$lib/server/cookies';
import { rawStr, str } from '$lib/server/forms';

function safeNext(next: string | null): string {
	return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('next')));
	return { next: safeNext(url.searchParams.get('next')) };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url }) => {
		const fd = await request.formData();
		const email = str(fd, 'email');
		const password = rawStr(fd, 'password');
		pruneLoginAttempts(locals.db);
		const result = await loginWithPassword(locals.db, email, password);
		if (!result.ok) {
			const error = result.reason === 'throttled' ? 'Zu viele Versuche. Bitte eine Minute warten.' : 'E-Mail oder Passwort falsch.';
			return fail(400, { error, email });
		}
		const s = createSession(locals.db, result.user.id);
		setSessionCookie(cookies, s.id, s.expiresAt);
		redirect(303, safeNext(url.searchParams.get('next')));
	}
};
