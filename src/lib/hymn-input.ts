export function leadingInt(text: string): number | null {
	const m = text.trim().match(/^(\d+)/);
	return m ? parseInt(m[1], 10) : null;
}
