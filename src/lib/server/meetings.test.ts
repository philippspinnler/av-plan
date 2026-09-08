import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { createHymn } from './hymns';
import { createMember } from './members';
import {
	createMeeting, ensureSundays, getMeetingByDate, hasProgram, listMeetings, loadMeetingFullByDate,
	saveAnnouncements, saveCallings, saveConductor, saveGeneral, saveMusic, savePrayers, saveTalks
} from './meetings';

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
});

describe('meetings', () => {
	it('legt nur Sonntage an', () => {
		expect(() => createMeeting(db, '2026-09-14')).toThrowError('Datum ist kein Sonntag');
		const m = createMeeting(db, '2026-09-13');
		expect(m.kind).toBe('normal');
		expect(getMeetingByDate(db, '2026-09-13')?.id).toBe(m.id);
	});
	it('ergänzt fehlende Sonntage idempotent', () => {
		createMeeting(db, '2026-09-13');
		const created = ensureSundays(db, '2026-09-07', 1);
		expect(created).toBe(3);
		expect(ensureSundays(db, '2026-09-07', 1)).toBe(0);
		expect(listMeetings(db, '2026-09-01', '2026-10-31').map((m) => m.meeting.date)).toEqual(['2026-09-13', '2026-09-20', '2026-09-27', '2026-10-04']);
	});
	it('hasProgram', () => {
		expect(hasProgram('normal')).toBe(true);
		expect(hasProgram('fastsonntag')).toBe(true);
		expect(hasProgram('gemeindekonferenz')).toBe(true);
		expect(hasProgram('generalkonferenz')).toBe(false);
		expect(hasProgram('keine')).toBe(false);
	});
	it('speichert und lädt alle Abschnitte', () => {
		const m = createMeeting(db, '2026-09-13');
		const anna = createMember(db, { firstName: 'Anna', lastName: 'Rey' });
		const joerg = createMember(db, { firstName: 'Urs', lastName: 'Bischof' });
		const h1 = createHymn(db, { number: 202, title: 'Ich bin ein Kind von Gott' });
		createHymn(db, { number: 56, title: 'O fest wie ein Felsen' });

		saveGeneral(db, m.id, { kind: 'fastsonntag', theme: 'Familie', specialNote: null, presidingMemberId: joerg.id, absences: 'Reto' });
		savePrayers(db, m.id, [
			{ position: 1, memberId: anna.id, status: 'zugesagt' },
			{ position: 2, memberId: null, status: 'offen' }
		]);
		saveTalks(db, m.id, [
			{ position: 1, memberId: anna.id, topic: 'Liebe', durationMinutes: 5, status: 'angefragt', note: null },
			{ position: 3, memberId: null, topic: null, durationMinutes: 15, status: 'offen', note: 'kurzfristig' }
		]);
		saveAnnouncements(db, m.id, ['Pfahl-Plauschtag', 'Neue 2. Stunde']);
		saveCallings(db, m.id, [{ kind: 'berufung', personName: 'Nadja Moser', calling: 'FHV-Präsidentin' }]);
		const music = saveMusic(db, m.id, {
			hymns: {
				anfang: { hymnNumber: 202, freeText: null },
				abendmahl: { hymnNumber: 56, freeText: null },
				zwischen: { hymnNumber: null, freeText: 'PV singt' },
				schluss: { hymnNumber: 9999, freeText: null }
			},
			organistMemberId: anna.id,
			conductorMemberId: null,
			musicNote: 'Vreni fehlt'
		});
		expect(music.unknownNumbers).toEqual([9999]);

		const full = loadMeetingFullByDate(db, '2026-09-13')!;
		expect(full.meeting.kind).toBe('fastsonntag');
		expect(full.presiding?.firstName).toBe('Urs');
		expect(full.prayers.map((p) => [p.position, p.member?.firstName ?? null, p.status])).toEqual([[1, 'Anna', 'zugesagt'], [2, null, 'offen']]);
		expect(full.talks.map((t) => t.position)).toEqual([1, 3]);
		expect(full.talks[1].note).toBe('kurzfristig');
		expect(full.announcements).toEqual(['Pfahl-Plauschtag', 'Neue 2. Stunde']);
		expect(full.callings[0].calling).toBe('FHV-Präsidentin');
		expect(full.hymns.anfang.hymn?.id).toBe(h1.id);
		// Fastsonntag: kein Zwischenlied, auch wenn eines übergeben wurde
		expect(full.hymns.zwischen).toEqual({ hymn: null, freeText: null });
		expect(full.hymns.schluss).toEqual({ hymn: null, freeText: null });
		expect(full.organist?.firstName).toBe('Anna');
		expect(full.meeting.musicNote).toBe('Vreni fehlt');

		saveAnnouncements(db, m.id, []);
		expect(loadMeetingFullByDate(db, '2026-09-13')!.announcements).toEqual([]);
	});

	it('saveConductor setzt und löscht nur das Dirigieren-Feld', () => {
		const m = createMeeting(db, '2026-09-13');
		const anna = createMember(db, { firstName: 'Anna', lastName: 'Rey' });
		saveConductor(db, m.id, anna.id);
		expect(loadMeetingFullByDate(db, '2026-09-13')!.conductor?.firstName).toBe('Anna');
		saveConductor(db, m.id, null);
		expect(loadMeetingFullByDate(db, '2026-09-13')!.conductor).toBeNull();
	});

	it('saveMusic verwirft das Zwischenlied bei Fastsonntag', () => {
		const m = createMeeting(db, '2026-09-13');
		saveGeneral(db, m.id, { kind: 'fastsonntag', theme: null, specialNote: null, presidingMemberId: null, absences: null });
		createHymn(db, { number: 202, title: 'Ich bin ein Kind von Gott' });
		const result = saveMusic(db, m.id, {
			hymns: {
				anfang: { hymnNumber: 202, freeText: null },
				abendmahl: { hymnNumber: null, freeText: null },
				zwischen: { hymnNumber: 9999, freeText: 'PV singt' },
				schluss: { hymnNumber: null, freeText: null }
			},
			organistMemberId: null,
			conductorMemberId: null,
			musicNote: null
		});
		expect(result.unknownNumbers).toEqual([]);
		const full = loadMeetingFullByDate(db, '2026-09-13')!;
		expect(full.hymns.zwischen).toEqual({ hymn: null, freeText: null });
	});
});
