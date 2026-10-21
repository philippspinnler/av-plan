/** A message meant for the person at the form; anything else is logged and replaced by a generic text. */
export class UserError extends Error {}

export function failMessage(e: unknown): string {
	if (e instanceof UserError) return e.message;
	console.error(e);
	return 'Speichern fehlgeschlagen.';
}

export function str(fd: FormData, key: string): string {
	const v = fd.get(key);
	return typeof v === 'string' ? v.trim() : '';
}

export function rawStr(fd: FormData, key: string): string {
	const v = fd.get(key);
	return typeof v === 'string' ? v : '';
}

export function optStr(fd: FormData, key: string): string | null {
	const v = str(fd, key);
	return v === '' ? null : v;
}

export function int(fd: FormData, key: string): number {
	const n = parseInt(str(fd, key), 10);
	return Number.isNaN(n) ? 0 : n;
}

export function optInt(fd: FormData, key: string): number | null {
	const v = str(fd, key);
	if (v === '') return null;
	const n = parseInt(v, 10);
	return Number.isNaN(n) ? null : n;
}

export function strList(fd: FormData, key: string): string[] {
	return fd
		.getAll(key)
		.filter((v): v is string => typeof v === 'string')
		.map((v) => v.trim())
		.filter((v) => v !== '');
}

/** Only a path on our own origin; `//host`, `/\host` and absolute URLs fall back to `/`. */
export function safeNext(next: string | null, origin: string): string {
	if (!next) return '/';
	try {
		const u = new URL(next, origin);
		return u.origin === origin ? u.pathname + u.search : '/';
	} catch {
		return '/';
	}
}
