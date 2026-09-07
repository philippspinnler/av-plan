export function parseDuration(text: string): number | null {
	const t = text.trim();
	if (!t) return null;
	const m = t.match(/^(\d+):(\d{1,2})$/);
	if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
	if (/^\d+$/.test(t)) return parseInt(t, 10);
	return null;
}

export function formatDuration(sec: number | null): string {
	if (sec === null || sec === undefined) return '';
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}
