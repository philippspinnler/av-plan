import { asc, eq, gte } from 'drizzle-orm';
import type { Db } from './db';
import { youthBreaks, type YouthBreak } from './db/schema';

export function listBreaks(db: Db, from?: string): YouthBreak[] {
	const q = db.select().from(youthBreaks);
	return (from ? q.where(gte(youthBreaks.toDate, from)) : q).orderBy(asc(youthBreaks.fromDate)).all();
}

export function breakFor(breaks: YouthBreak[], date: string): YouthBreak | null {
	return breaks.find((b) => b.fromDate <= date && date <= b.toDate) ?? null;
}

export const YOUTH_BREAK_KIND_LABELS: Record<YouthBreak['kind'], string> = { ferien: 'Ferien', pfahl: 'Pfahl', tempel: 'Tempel' };

export function createBreak(db: Db, input: { fromDate: string; toDate: string; label: string | null; kind: YouthBreak['kind'] }): YouthBreak {
	if (input.toDate < input.fromDate) throw new Error('Das Enddatum liegt vor dem Startdatum.');
	return db.insert(youthBreaks).values(input).returning().get();
}

export function deleteBreak(db: Db, id: number) {
	db.delete(youthBreaks).where(eq(youthBreaks.id, id)).run();
}
