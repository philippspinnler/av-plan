import { describe, expect, it } from 'vitest';
import type { Member } from './db/schema';
import { memberOptions } from './picker';
import type { MemberActivity } from './stats';

const m = (id: number, firstName: string, lastName: string, extra: Partial<Member> = {}): Member => ({
	id, firstName, lastName, affiliation: null, active: true, noteTalk: null, notePrayer: null, createdAt: '', updatedAt: '', ...extra
});
const members = [m(1, 'Anna', 'Rey'), m(2, 'Beat', 'Fischer', { noteTalk: 'gerne kurz' }), m(3, 'Carla', 'Hofer', { active: false }), m(4, 'Dora', 'Arnold', { affiliation: 'Hoherat' })];
const act = new Map<number, MemberActivity>([
	[1, { lastTalk: '2026-06-07', lastPrayer: null, nextTalk: '2026-09-20', nextPrayer: null }],
	[2, { lastTalk: '2026-08-30', lastPrayer: null, nextTalk: null, nextPrayer: null }]
]);
const TODAY = '2026-09-07';

describe('memberOptions', () => {
	it('sortiert nach längster Pause, "nie" zuerst, blendet Inaktive aus', () => {
		const o = memberOptions(members, act, 'talk', TODAY);
		expect(o.map((x) => x.id)).toEqual([4, 1, 2]);
		expect(o[0]).toEqual({ id: 4, label: 'Dora Arnold (Hoherat)', hint: 'nie' });
		expect(o[1].hint).toBe('vor 13 Wochen, geplant 20.09.2026');
		expect(o[2].hint).toBe('vor 1 Woche · gerne kurz');
	});
	it('nimmt ein inaktives, aber gewähltes Mitglied mit', () => {
		expect(memberOptions(members, act, 'talk', TODAY, 3).map((x) => x.id)).toEqual([4, 3, 1, 2]);
	});
	it('plain sortiert nach Namen ohne Hinweis', () => {
		const o = memberOptions(members, act, 'plain', TODAY);
		expect(o.map((x) => x.label)).toEqual(['Dora Arnold (Hoherat)', 'Beat Fischer', 'Anna Rey']);
		expect(o.every((x) => x.hint === '')).toBe(true);
	});
});
