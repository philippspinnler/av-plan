import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { createUser } from './auth';
import { youthEvents } from './db/schema';
import { createIdea, dismissIdea, listIdeas, openIdeasFor, planIdea } from './youth-ideas';

let db: Db;
let userId: number;
beforeEach(async () => {
	db = createDb(':memory:');
	userId = (await createUser(db, { email: 'a@example.org', name: 'Anna Beispiel', role: 'jd_leitung', password: 'secret-pass-1' })).id;
});

const idea = (text: string, side: 'jd' | 'jm' | 'both') => createIdea(db, { text, side, note: null, createdBy: userId });

describe('youth ideas', () => {
	it('openIdeasFor filters by side and includes both', () => {
		idea('A', 'jd');
		idea('B', 'jm');
		idea('C', 'both');
		expect(openIdeasFor(db, 'jd').map((i) => i.text).sort()).toEqual(['A', 'C']);
		expect(openIdeasFor(db, 'jm').map((i) => i.text).sort()).toEqual(['B', 'C']);
		expect(openIdeasFor(db, 'both')).toHaveLength(3);
	});
	it('planIdea and dismissIdea remove from the open list', () => {
		const a = idea('A', 'jd');
		const b = idea('B', 'jd');
		idea('C', 'jd');
		const ev = db.insert(youthEvents).values({ date: '2026-11-04' }).returning().get();
		planIdea(db, a.id, ev.id);
		dismissIdea(db, b.id);
		expect(listIdeas(db, { open: true }).map((i) => i.text)).toEqual(['C']);
		const closed = listIdeas(db, { open: false });
		expect(closed.map((i) => i.text).sort()).toEqual(['A', 'B']);
		expect(closed[0].createdByName).toBe('Anna Beispiel');
	});
	it('planIdea on a dismissed idea makes it planned only', () => {
		const a = idea('A', 'jd');
		const ev = db.insert(youthEvents).values({ date: '2026-11-04' }).returning().get();
		dismissIdea(db, a.id);
		planIdea(db, a.id, ev.id);
		const [r] = listIdeas(db, { open: false });
		expect(r.plannedEventId).toBe(ev.id);
		expect(r.dismissedAt).toBeNull();
	});
});
