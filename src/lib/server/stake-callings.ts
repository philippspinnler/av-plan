import { asc, eq, sql } from 'drizzle-orm';
import type { Db } from './db';
import { members, stakeCallings, type StakeCalling } from './db/schema';

export function listStakeCallings(db: Db): StakeCalling[] {
	return db.select().from(stakeCallings).orderBy(asc(stakeCallings.position), asc(stakeCallings.name)).all();
}

export function findStakeCallingByName(db: Db, name: string): StakeCalling | undefined {
	const wanted = name.trim().toLowerCase();
	return listStakeCallings(db).find((c) => c.name.toLowerCase() === wanted);
}

export function createStakeCalling(db: Db, name: string): StakeCalling {
	const clean = name.trim();
	if (!clean) throw new Error('Name darf nicht leer sein');
	if (findStakeCallingByName(db, clean)) throw new Error('Berufung existiert bereits');
	const max = db.select({ m: sql<number>`coalesce(max(${stakeCallings.position}), 0)` }).from(stakeCallings).get()?.m ?? 0;
	return db.insert(stakeCallings).values({ name: clean, position: max + 1 }).returning().get();
}

export function ensureStakeCalling(db: Db, name: string): StakeCalling {
	return findStakeCallingByName(db, name) ?? createStakeCalling(db, name);
}

export function renameStakeCalling(db: Db, id: number, name: string): void {
	const clean = name.trim();
	if (!clean) throw new Error('Name darf nicht leer sein');
	const other = findStakeCallingByName(db, clean);
	if (other && other.id !== id) throw new Error('Berufung existiert bereits');
	db.update(stakeCallings).set({ name: clean }).where(eq(stakeCallings.id, id)).run();
}

/** Löscht eine Berufung; false, wenn sie noch bei Pfahlbeamten verwendet wird. */
export function deleteStakeCalling(db: Db, id: number): boolean {
	const used = db.select({ id: members.id }).from(members).where(eq(members.stakeCallingId, id)).get();
	if (used) return false;
	db.delete(stakeCallings).where(eq(stakeCallings.id, id)).run();
	return true;
}

export function moveStakeCalling(db: Db, id: number, dir: -1 | 1): void {
	const list = listStakeCallings(db);
	const i = list.findIndex((c) => c.id === id);
	const j = i + dir;
	if (i < 0 || j < 0 || j >= list.length) return;
	[list[i], list[j]] = [list[j], list[i]];
	db.transaction((tx) => {
		list.forEach((c, pos) => tx.update(stakeCallings).set({ position: pos + 1 }).where(eq(stakeCallings.id, c.id)).run());
	});
}
