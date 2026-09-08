import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { ROLES, type Role } from '$lib/server/db/schema';
import { str } from '$lib/server/forms';
import { ROLE_VIEW_COOKIE } from '$lib/server/role-view';

const isRole = (r: string): r is Role => (ROLES as readonly string[]).includes(r);

export const POST: RequestHandler = async ({ request, cookies, locals, url }) => {
	if (locals.accountRole !== 'admin') error(403, 'Nur für Admins');
	const fd = await request.formData();
	const role = str(fd, 'role');
	if (isRole(role) && role !== 'admin') {
		cookies.set(ROLE_VIEW_COOKIE, role, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 });
	} else {
		cookies.delete(ROLE_VIEW_COOKIE, { path: '/' });
	}
	const referer = request.headers.get('referer');
	const target = referer && referer.startsWith(url.origin) ? referer : '/';
	redirect(303, target);
};
