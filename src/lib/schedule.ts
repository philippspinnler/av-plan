export type ProgramItem = { type: 'talk'; position: number } | { type: 'zwischenlied' };
export interface TimedItem { item: ProgramItem; start: string | null; end: string | null }

export function programOrder(positions: number[]): ProgramItem[] {
	const sorted = [...positions].sort((a, b) => a - b);
	const talks: ProgramItem[] = sorted.map((position) => ({ type: 'talk', position }));
	const insertAfter = sorted.length >= 3 ? 2 : sorted.length >= 1 ? 1 : 0;
	return [...talks.slice(0, insertAfter), { type: 'zwischenlied' }, ...talks.slice(insertAfter)];
}

export function addMinutes(hhmm: string, minutes: number): string {
	const [h, m] = hhmm.split(':').map(Number);
	const total = h * 60 + m + minutes;
	return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function hymnMinutes(durationSeconds: number | null): number {
	return durationSeconds ? Math.ceil(durationSeconds / 60) : 4;
}

export function computeTimes(
	startTime: string | null,
	items: ProgramItem[],
	talkMinutes: Map<number, number | null>,
	zwischenMinutes: number
): TimedItem[] {
	let cursor: string | null = startTime && /^\d{1,2}:\d{2}$/.test(startTime) ? startTime : null;
	return items.map((item) => {
		if (cursor === null) return { item, start: null, end: null };
		const minutes = item.type === 'talk' ? (talkMinutes.get(item.position) ?? null) : zwischenMinutes;
		const start = cursor;
		if (minutes === null) {
			cursor = null;
			return { item, start, end: null };
		}
		const end = addMinutes(start, minutes);
		cursor = end;
		return { item, start, end };
	});
}
