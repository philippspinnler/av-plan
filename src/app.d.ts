// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Db } from '$lib/server/db';
import type { SessionUser } from '$lib/server/auth';
import type { Role } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			db: Db;
			user: SessionUser | null;
			accountRole: Role | null;
		}
	}
}

export {};
