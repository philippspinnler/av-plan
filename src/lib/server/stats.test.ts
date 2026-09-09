import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { createHymn, getHymnByNumber } from './hymns';
import { createMember } from './members';
import { createMeeting, loadMeetingFullByDate, saveGeneral, saveMusic, savePrayers, saveTalks } from './meetings';
import { hymnHistory, hymnUsage, memberActivity, memberHistory, readiness, weeksAgoLabel, weeksAheadLabel } from './stats';

let db: Db;
let anna: number;
let beat: number;
const TODAY = '2026-09-07';

function sunday(date: string, opts: { talk?: number; prayer?: number; hymn?: number; kind?: 'normal' | 'generalkonferenz' } = {}) {
	const m = createMeeting(db, date);
	if (opts.kind) saveGeneral(db, m.id, { kind: opts.kind, theme: null, specialNote: null, presidingMemberId: null, absences: null });
	if (opts.talk) saveTalks(db, m.id, [{ position: 1, memberId: opts.talk, topic: 'T', durationMinutes: 5, status: 'zugesagt', note: null }]);
	if (opts.prayer) savePrayers(db, m.id, [{ position: 1, memberId: opts.prayer, status: 'zugesagt' }]);
	if (opts.hymn) saveMusic(db, m.id, { hymns: { anfang: { hymnNumber: opts.hymn, freeText: null }, abendmahl: { hymnNumber: null, freeText: null }, zwischen: { hymnNumber: null, freeText: null }, schluss: { hymnNumber: null, freeText: null } }, organistMemberId: null, conductorMemberId: null, musicNote: null });
	return m;
}

beforeEach(() => {
	db = createDb(':memory:');
	anna = createMember(db, { firstName: 'Anna', lastName: 'Rey' }).id;
	beat = createMember(db, { firstName: 'Beat', lastName: 'Fischer' }).id;
	createHymn(db, { number: 3, title: 'O Fülle des Heiles' });
});

describe('memberActivity', () => {
	it('findet letzten und nächsten Einsatz und ignoriert Konferenzen', () => {
		sunday('2025-06-01', { talk: anna });
		sunday('2026-08-30', { talk: anna, prayer: beat });
		sunday('2026-09-06', { talk: anna, kind: 'generalkonferenz' });
		sunday('2026-09-20', { talk: anna, prayer: anna });
		const a = memberActivity(db, TODAY);
		expect(a.get(anna)).toEqual({ lastTalk: '2026-08-30', lastPrayer: null, nextTalk: '2026-09-20', nextPrayer: '2026-09-20' });
		expect(a.get(beat)).toEqual({ lastTalk: null, lastPrayer: '2026-08-30', nextTalk: null, nextPrayer: null });
	});
	it('weeksAheadLabel', () => {
		expect(weeksAheadLabel('2026-09-13', TODAY)).toBe('diese Woche');
		expect(weeksAheadLabel('2026-09-20', TODAY)).toBe('nächste Woche');
		expect(weeksAheadLabel('2026-10-04', TODAY)).toBe('in 3 Wochen');
	});
	it('weeksAgoLabel', () => {
		expect(weeksAgoLabel(null, TODAY)).toBe('nie');
		expect(weeksAgoLabel('2026-09-06', TODAY)).toBe('diese Woche');
		expect(weeksAgoLabel('2026-08-30', TODAY)).toBe('vor 1 Woche');
		expect(weeksAgoLabel('2026-06-07', TODAY)).toBe('vor 13 Wochen');
	});
	it('memberHistory ist absteigend', () => {
		sunday('2026-08-30', { talk: anna });
		sunday('2026-09-20', { prayer: anna });
		expect(memberHistory(db, anna).map((h) => [h.date, h.kind])).toEqual([['2026-09-20', 'prayer'], ['2026-08-30', 'talk']]);
	});
});

describe('hymnUsage', () => {
	it('zählt letzte 52 Wochen und gesamt', () => {
		sunday('2025-01-05', { hymn: 3 });
		sunday('2026-06-07', { hymn: 3 });
		sunday('2026-08-30', { hymn: 3 });
		sunday('2026-09-20', { hymn: 3 });
		const id = getHymnByNumber(db, 3)!.id;
		expect(hymnUsage(db, TODAY).get(id)).toEqual({ lastSung: '2026-08-30', count52: 2, countTotal: 3 });
		expect(hymnHistory(db, id).map((h) => h.date)).toEqual(['2026-09-20', '2026-08-30', '2026-06-07', '2025-01-05']);
	});
});

describe('readiness', () => {
	it('listet fehlende Teile getrennt nach Programm und Musik', () => {
		const m = sunday('2026-09-13', { hymn: 3 });
		saveTalks(db, m.id, [{ position: 1, memberId: anna, topic: null, durationMinutes: null, status: 'zugesagt', note: null }]);
		const r = readiness(loadMeetingFullByDate(db, '2026-09-13')!);
		expect(r.program).toEqual(['Leitung', 'Anfangsgebet', 'Schlussgebet', 'Ansprachen (1 von 2 zugesagt)']);
		expect(r.music).toEqual(['Abendmahlslied', 'Schlusslied', 'Orgel', 'Dirigieren']);
	});
	it('Fastsonntag braucht keine Ansprachen, Konferenzen brauchen nichts', () => {
		const f = sunday('2026-10-04');
		saveGeneral(db, f.id, { kind: 'fastsonntag', theme: null, specialNote: null, presidingMemberId: anna, absences: null });
		savePrayers(db, f.id, [{ position: 1, memberId: anna, status: 'zugesagt' }, { position: 2, memberId: beat, status: 'zugesagt' }]);
		expect(readiness(loadMeetingFullByDate(db, '2026-10-04')!).program).toEqual([]);
		sunday('2026-10-11', { kind: 'generalkonferenz' });
		expect(readiness(loadMeetingFullByDate(db, '2026-10-11')!)).toEqual({ program: [], music: [] });
	});
});
