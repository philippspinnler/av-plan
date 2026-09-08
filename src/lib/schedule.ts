export type ProgramItem = { type: 'talk'; position: number } | { type: 'zwischenlied' };

export function programOrder(positions: number[]): ProgramItem[] {
	const sorted = [...positions].sort((a, b) => a - b);
	const talks: ProgramItem[] = sorted.map((position) => ({ type: 'talk', position }));
	const insertAfter = sorted.length >= 3 ? 2 : sorted.length >= 1 ? 1 : 0;
	return [...talks.slice(0, insertAfter), { type: 'zwischenlied' }, ...talks.slice(insertAfter)];
}
