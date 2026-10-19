import { asc, gte } from 'drizzle-orm';
import type { Db } from './db';
import { youthBreaks, type YouthBreak } from './db/schema';

export function listBreaks(db: Db, from?: string): YouthBreak[] {
	const q = db.select().from(youthBreaks);
	return (from ? q.where(gte(youthBreaks.toDate, from)) : q).orderBy(asc(youthBreaks.fromDate)).all();
}

export function breakFor(breaks: YouthBreak[], date: string): YouthBreak | null {
	return breaks.find((b) => b.fromDate <= date && date <= b.toDate) ?? null;
}
