import { asc, eq } from 'drizzle-orm';
import { normalizeName, stripPrefix } from '../names';
import type { Db } from './db';
import { members, type Member } from './db/schema';

export interface MemberInput {
	firstName: string;
	lastName: string;
	affiliation?: string | null;
	active?: boolean;
	noteTalk?: string | null;
	notePrayer?: string | null;
}

export function listMembers(db: Db, opts: { activeOnly?: boolean } = {}): Member[] {
	const base = db.select().from(members);
	const q = opts.activeOnly ? base.where(eq(members.active, true)) : base;
	return q.orderBy(asc(members.lastName), asc(members.firstName)).all();
}

export function getMember(db: Db, id: number): Member | undefined {
	return db.select().from(members).where(eq(members.id, id)).get();
}

export function createMember(db: Db, input: MemberInput): Member {
	return db
		.insert(members)
		.values({
			firstName: input.firstName.trim(),
			lastName: input.lastName.trim(),
			affiliation: input.affiliation?.trim() || null,
			active: input.active ?? true,
			noteTalk: input.noteTalk?.trim() || null,
			notePrayer: input.notePrayer?.trim() || null
		})
		.returning()
		.get();
}

export function updateMember(db: Db, id: number, patch: Partial<MemberInput>): void {
	db.update(members)
		.set({ ...patch, updatedAt: new Date().toISOString() })
		.where(eq(members.id, id))
		.run();
}

export function displayName(m: Pick<Member, 'firstName' | 'lastName' | 'affiliation'>): string {
	const name = `${m.firstName} ${m.lastName}`.trim();
	return m.affiliation ? `${name} (${m.affiliation})` : name;
}

export function matchMember(all: Member[], raw: string): Member | null {
	const { name } = stripPrefix(raw);
	const idx = name.indexOf(',');
	const wanted = normalizeName(idx >= 0 ? `${name.slice(idx + 1)} ${name.slice(0, idx)}` : name);
	if (!wanted) return null;
	const hits = all.filter((m) => normalizeName(`${m.firstName} ${m.lastName}`) === wanted);
	return hits.length === 1 ? hits[0] : null;
}

export function findMemberByName(db: Db, raw: string): Member | null {
	return matchMember(listMembers(db), raw);
}

export function matchByFirstName(all: Member[], first: string): Member | null {
	const wanted = normalizeName(first);
	if (!wanted) return null;
	const hits = all.filter((m) => m.active && normalizeName(m.firstName) === wanted);
	return hits.length === 1 ? hits[0] : null;
}
