import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, createUser, userCount } from '$lib/server/auth';
import { setSessionCookie } from '$lib/server/cookies';
import { rawStr, str } from '$lib/server/forms';

export const load: PageServerLoad = ({ locals }) => {
	if (userCount(locals.db) > 0) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		if (userCount(locals.db) > 0) redirect(303, '/');
		const fd = await request.formData();
		const name = str(fd, 'name');
		const email = str(fd, 'email');
		const password = rawStr(fd, 'password');
		if (!name || !email.includes('@')) return fail(400, { error: 'Bitte Name und gültige E-Mail angeben.', name, email });
		if (password.length < 8) return fail(400, { error: 'Das Passwort braucht mindestens 8 Zeichen.', name, email });
		const user = await createUser(locals.db, { name, email, role: 'admin', password });
		const s = createSession(locals.db, user.id);
		setSessionCookie(cookies, s.id, s.expiresAt);
		redirect(303, '/');
	}
};
