import { asc, eq, gte } from 'drizzle-orm';
import { addDays, toIso, parseIso } from '$lib/dates';
import type { Db } from './db';
import { youthBreaks, type YouthBreak } from './db/schema';

export function listBreaks(db: Db, from?: string): YouthBreak[] {
	const q = db.select().from(youthBreaks);
	return (from ? q.where(gte(youthBreaks.toDate, from)) : q).orderBy(asc(youthBreaks.fromDate)).all();
}

/** Holidays cancel the Wednesdays inside them; any other event in the same week (Monday to Sunday) cancels that Wednesday. */
export function breakFor(breaks: YouthBreak[], wednesday: string): YouthBreak | null {
	const monday = addDays(wednesday, -2);
	const sunday = addDays(wednesday, 4);
	return breaks.find((b) => (b.kind === 'ferien' ? b.fromDate <= wednesday && wednesday <= b.toDate : b.fromDate <= sunday && monday <= b.toDate)) ?? null;
}

export const YOUTH_BREAK_KIND_LABELS: Record<YouthBreak['kind'], string> = { ferien: 'Ferien', pfahl: 'Pfahl-Aktivität', tempel: 'Tempel', supersamstag: 'Supersamstag', tanzabend: 'Tanzabend' };

export function createBreak(db: Db, input: { fromDate: string; toDate: string; label: string | null; kind: YouthBreak['kind'] }): YouthBreak {
	for (const d of [input.fromDate, input.toDate]) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || toIso(parseIso(d)) !== d) throw new Error('Ungültiges Datum');
	}
	if (input.toDate < input.fromDate) throw new Error('Das Enddatum liegt vor dem Startdatum.');
	return db.insert(youthBreaks).values(input).returning().get();
}

export function deleteBreak(db: Db, id: number) {
	db.delete(youthBreaks).where(eq(youthBreaks.id, id)).run();
}
