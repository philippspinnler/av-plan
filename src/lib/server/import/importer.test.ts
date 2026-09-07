import ExcelJS from 'exceljs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, type Db } from '../db';
import { getHymnByNumber, listHymns } from '../hymns';
import { findMemberByName, listMembers } from '../members';
import { loadMeetingFullByDate } from '../meetings';
import { importWorkbooks, type ImportReport } from './importer';

const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m - 1, day));
const dur = (min: number, sec: number) => new Date(Date.UTC(1899, 11, 30, 0, min, sec));

async function writeFixtures(dir: string) {
	const av = new ExcelJS.Workbook();
	const ml = av.addWorksheet('Mitgliederliste');
	ml.addRow(['Name Tools', 'Suchname', 'Inaktiv/Kind/weggezogen', 'Kommentar Ansprache', 'Kommentar Gebet']);
	ml.addRow(['Rey, Anna', 'Anna Rey', null, 'gerne kurz', null]);
	ml.addRow(['Achermann, Edith', 'Edith Achermann', 'x', null, 'will lieber nicht beten']);
	ml.addRow(['Dürst, HR-Daniel', 'HR-Daniel Dürst', null, null, null]);
	ml.addRow(['Widmer, Vreni', 'Vreni Widmer', null, null, null]);
	ml.addRow(['Bischof, Urs', 'Urs Bischof', null, null, null]);
	const pr = av.addWorksheet('Programm');
	pr.addRow([null, 'Liederplanung']);
	pr.addRow(['OK', 'Datum', 'Thema', 'Spezial', 'Abwesenheiten', 'Leitung', 'Gebet1', 'Gebet2', 'Nr 1', 'Anfangslied', 'Nr 2', 'Abendmahlslied', 'Ansprache 1', 'Thema 1', 'Ansprache 2', 'Thema 2', 'Nr 3', 'Zwischelied', 'Ansprache 3', 'Thema 3', 'Anpsrache 4', 'Thema 4', 'Nr. 4', 'Schlusslied', 'Orgel', 'Dirigieren']);
	pr.addRow([null, d(2026, 8, 30), 'Schwächen', null, 'Reto', 'Urs', 'Anna Rey', '-', 47, ' Herr und Gott der Himmelsheere', 61, ' Näher, mein Gott, zu dir', 'HR-Daniel Dürst', 'Glaube', 'Elder Neuer', null, 58, ' Führ, gütges Licht', 'Anna Rey', 'Rückfrage??', null, null, 33, ' Hört, ihr Geschöpfe all, frohlockt!', 'Vreni', 'Lea']);
	pr.addRow([null, d(2026, 10, 4), null, 'Generalkonferenz']);
	pr.addRow([null, d(2026, 10, 11), 'Gebet', 'Fastsonntag?', null, 'Urs', null, null, null, null, null, null, 'Anna Rey', 'Confirm', 'Unbekannt Neu', 'Einladen']);
	pr.addRow([null, 'kein Datum']);
	const avLieder = av.addWorksheet('Lieder');
	avLieder.addRow([33, ' Hört, ihr Geschöpfe all, frohlockt!']);
	avLieder.addRow([47, ' Herr und Gott der Himmelsheere']);
	await av.xlsx.writeFile(path.join(dir, 'av.xlsx'));

	const lp = new ExcelJS.Workbook();
	const lieder = lp.addWorksheet('Lieder');
	lieder.addRow([47, ' Herr und Gott der Himmelsheere', dur(3, 30)]);
	lieder.addRow([61, ' Näher, mein Gott, zu dir', null]);
	lieder.addRow([58, ' Führ, gütges Licht', null]);
	lieder.addRow([1019, 'Hilf mir, zu lieben, Herr, wie du', dur(2, 28)]);
	const lav = lp.addWorksheet('Lieder AV');
	lav.addRow([14]);
	lav.addRow(['', 'Spezial', 'Thema Abendmahlsversammlung', 'ZEIT', 'mm:ss', 'Nr 1', 'Anfangslied', 'mm:ss', 'Nr 2', 'Abendmahlslied', 'mm:ss', 'Nr 3', 'Zwischenlied', 'mm:ss', 'Nr. 4', 'Schlusslied', 'Orgel/Klavier', 'Dirigieren', 'Abwesenheit']);
	lav.addRow([d(2026, 8, 30), null, 'Schwächen', null, null, 47, ' Herr und Gott', null, 61, ' Näher', null, 58, ' Führ', null, 33, ' Hört', 'Vreni', 'Lea', 'Mia']);
	lav.addRow([d(2026, 10, 11), 'Fastsonntag', null, null, null, 1019, 'Hilf mir, zu lieben, Herr, wie du', null, null, null, null, null, 'PV singt', null, null, null, 'Vreni', null, null]);
	lav.addRow([d(2026, 10, 18), null, 'Nur Musik geplant', null, null, 47, ' Herr und Gott']);
	await lp.xlsx.writeFile(path.join(dir, 'lieder.xlsx'));
}

let dir: string;
let db: Db;
let report: ImportReport;

beforeAll(async () => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-import-'));
	await writeFixtures(dir);
	db = createDb(':memory:');
	report = await importWorkbooks(db, path.join(dir, 'av.xlsx'), path.join(dir, 'lieder.xlsx'), { today: '2026-09-07' });
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('importWorkbooks', () => {
	it('importiert Mitglieder mit Flags, Notizen und Zugehörigkeit', () => {
		const anna = findMemberByName(db, 'Anna Rey')!;
		expect(anna.active).toBe(true);
		expect(anna.noteTalk).toBe('gerne kurz');
		const edith = findMemberByName(db, 'Edith Achermann')!;
		expect(edith.active).toBe(false);
		expect(edith.notePrayer).toBe('will lieber nicht beten');
		expect(findMemberByName(db, 'Daniel Dürst')?.affiliation).toBe('Hoherat');
	});
	it('legt unbekannte Sprecher an und meldet sie', () => {
		const elder = findMemberByName(db, 'Elder Neuer')!;
		expect(elder.affiliation).toBe('Missionar');
		expect(elder.active).toBe(true);
		const unknown = findMemberByName(db, 'Unbekannt Neu')!;
		expect(unknown.active).toBe(false);
		expect(report.unresolved).toEqual(expect.arrayContaining(['Elder Neuer', 'Unbekannt Neu']));
		expect(listMembers(db)).toHaveLength(7);
	});
	it('importiert Lieder aus beiden Dateien mit Dauer', () => {
		expect(listHymns(db).map((h) => h.number)).toEqual([33, 47, 58, 61, 1019]);
		expect(getHymnByNumber(db, 47)?.durationSeconds).toBe(210);
		expect(getHymnByNumber(db, 47)?.title).toBe('Herr und Gott der Himmelsheere');
		expect(getHymnByNumber(db, 1019)?.book).toBe('neu');
	});
	it('importiert einen vergangenen Sonntag vollständig', () => {
		const m = loadMeetingFullByDate(db, '2026-08-30')!;
		expect(m.meeting.kind).toBe('normal');
		expect(m.meeting.theme).toBe('Schwächen');
		expect(m.meeting.absences).toBe('Reto');
		expect(m.presiding?.firstName).toBe('Urs');
		expect(m.prayers).toHaveLength(1);
		expect(m.prayers[0].member?.firstName).toBe('Anna');
		expect(m.talks.map((t) => [t.position, t.member?.lastName, t.topic, t.status, t.note])).toEqual([
			[1, 'Dürst', 'Glaube', 'zugesagt', null],
			[2, 'Neuer', null, 'zugesagt', null],
			[3, 'Rey', null, 'zugesagt', 'Rückfrage??']
		]);
		expect(m.hymns.anfang.hymn?.number).toBe(47);
		expect(m.hymns.abendmahl.hymn?.number).toBe(61);
		expect(m.hymns.zwischen.hymn?.number).toBe(58);
		expect(m.hymns.schluss.hymn?.number).toBe(33);
		expect(m.organist?.firstName).toBe('Vreni');
		expect(m.conductor).toBeNull();
		expect(m.meeting.musicNote).toContain('Dirigieren: Lea');
		expect(m.meeting.musicNote).toContain('Mia');
	});
	it('setzt Status und Typ für künftige Sonntage', () => {
		const f = loadMeetingFullByDate(db, '2026-10-11')!;
		expect(f.meeting.kind).toBe('fastsonntag');
		expect(f.meeting.specialNote).toBeNull();
		expect(f.talks.map((t) => [t.member?.lastName, t.status])).toEqual([['Rey', 'angefragt'], ['Neu', 'offen']]);
		expect(f.hymns.anfang.hymn?.number).toBe(1019);
		expect(f.hymns.zwischen).toEqual({ hymn: null, freeText: 'PV singt' });
		expect(f.organist?.firstName).toBe('Vreni');
		expect(loadMeetingFullByDate(db, '2026-10-04')!.meeting.kind).toBe('generalkonferenz');
	});
	it('legt Sonntage an, die nur in der Liederplanung stehen, und zählt', () => {
		const only = loadMeetingFullByDate(db, '2026-10-18')!;
		expect(only.hymns.anfang.hymn?.number).toBe(47);
		expect(only.meeting.theme).toBe('Nur Musik geplant');
		expect(report.meetings).toBe(4);
		expect(report.hymns).toBe(5);
		expect(report.members).toBe(5);
	});
	it('ist idempotent', async () => {
		const again = await importWorkbooks(db, path.join(dir, 'av.xlsx'), path.join(dir, 'lieder.xlsx'), { today: '2026-09-07' });
		expect(again.members).toBe(0);
		expect(again.hymns).toBe(0);
		expect(listMembers(db)).toHaveLength(7);
		expect(loadMeetingFullByDate(db, '2026-08-30')!.talks).toHaveLength(3);
	});
});
