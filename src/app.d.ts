// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Db } from '$lib/server/db';
import type { SessionUser } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			db: Db;
			user: SessionUser | null;
		}
	}
}

export {};
