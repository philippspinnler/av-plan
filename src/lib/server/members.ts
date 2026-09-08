import { and, asc, eq } from 'drizzle-orm';
import { normalizeName, stripPrefix } from '../names';
import type { Db } from './db';
import { members, type Member, type MemberKind } from './db/schema';

/** Vorschlagsliste für Berufungen von Pfahlbeamten; Freitext bleibt erlaubt. */
export const STAKE_CALLINGS = [
	'Pfahlpräsident',
	'1. Ratgeber Pfahlpräsidentschaft',
	'2. Ratgeber Pfahlpräsidentschaft',
	'Hoherat',
	'Missionspräsident'
] as const;

/** Übersetzt eine importierte Zugehörigkeit (z.B. aus Präfixen wie HR-) in Art und Berufung. */
export function stakeFromAffiliation(affiliation: string | null): { kind: MemberKind; calling: string | null } {
	const stake = ['Hoherat', 'Pfahlpräsidentschaft', 'Tempelpräsidentschaft', 'Missionspräsidentschaft'];
	if (affiliation && stake.includes(affiliation)) return { kind: 'pfahl', calling: affiliation };
	return { kind: 'gemeinde', calling: null };
}

export interface MemberInput {
	firstName: string;
	lastName: string;
	affiliation?: string | null;
	kind?: MemberKind;
	calling?: string | null;
	active?: boolean;
	noteTalk?: string | null;
	notePrayer?: string | null;
}

export function listMembers(db: Db, opts: { activeOnly?: boolean; kind?: MemberKind } = {}): Member[] {
	const conds = [];
	if (opts.activeOnly) conds.push(eq(members.active, true));
	if (opts.kind) conds.push(eq(members.kind, opts.kind));
	const base = db.select().from(members);
	const q = conds.length ? base.where(and(...conds)) : base;
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
			kind: input.kind ?? 'gemeinde',
			calling: input.calling?.trim() || null,
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

export function displayName(m: Pick<Member, 'firstName' | 'lastName' | 'affiliation'> & { calling?: string | null }): string {
	const name = `${m.firstName} ${m.lastName}`.trim();
	const suffix = m.calling || m.affiliation;
	return suffix ? `${name} (${suffix})` : name;
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
