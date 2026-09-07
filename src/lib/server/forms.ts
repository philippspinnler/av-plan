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
