import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { live } from '$lib/server/live';

/** Browser reports: I (connection c) am on page `page`, in field `field`. */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Bitte anmelden');
	const body = (await request.json().catch(() => null)) as { client?: unknown; page?: unknown; field?: unknown } | null;
	const str = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max ? v : null);
	const client = str(body?.client, 64);
	const page = str(body?.page, 200);
	if (!client || !page) error(400, 'Ungültige Angaben');
	live.setPresence(client, { userId: locals.user.id, name: locals.user.name }, page, str(body?.field, 100));
	return json({ ok: true });
};
