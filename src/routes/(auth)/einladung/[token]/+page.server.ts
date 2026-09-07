import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { acceptInvite, createSession, getValidInvite } from '$lib/server/auth';
import { setSessionCookie } from '$lib/server/cookies';
import { str } from '$lib/server/forms';

export const load: PageServerLoad = ({ locals, params }) => {
	const inv = getValidInvite(locals.db, params.token);
	if (!inv) return { invalid: true, name: '', email: '' };
	return { invalid: false, name: inv.name, email: inv.email };
};

export const actions: Actions = {
	default: async ({ request, locals, params, cookies }) => {
		const fd = await request.formData();
		const password = str(fd, 'password');
		const confirm = str(fd, 'confirm');
		if (password.length < 8) return fail(400, { error: 'Das Passwort braucht mindestens 8 Zeichen.' });
		if (password !== confirm) return fail(400, { error: 'Die Passwörter stimmen nicht überein.' });
		const user = await acceptInvite(locals.db, params.token, password);
		if (!user) return fail(400, { error: 'Diese Einladung ist ungültig oder abgelaufen.' });
		const s = createSession(locals.db, user.id);
		setSessionCookie(cookies, s.id, s.expiresAt);
		redirect(303, '/');
	}
};
