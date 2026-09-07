import type { RequestHandler } from './$types';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { todayIso } from '$lib/dates';
import { requireRole } from '$lib/server/permissions';

export const GET: RequestHandler = async ({ locals }) => {
	requireRole(locals.user, 'users.manage');
	const tmp = path.join(os.tmpdir(), `av-backup-${process.pid}-${Date.now()}.db`);
	let data: Buffer<ArrayBuffer>;
	try {
		await locals.db.$client.backup(tmp);
		data = fs.readFileSync(tmp);
	} finally {
		if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
	}
	return new Response(data, {
		headers: {
			'Content-Type': 'application/vnd.sqlite3',
			'Content-Disposition': `attachment; filename="abendmahlsversammlung-${todayIso()}.db"`
		}
	});
};
