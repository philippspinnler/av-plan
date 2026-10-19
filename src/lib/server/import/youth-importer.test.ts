import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from '../db';
import { createMember } from '../members';
import { setBishopricMember } from '../bishopric';
import { listBreaks } from '../youth-breaks';
import { setYouth } from '../youth-people';
import { loadYouthEvent } from '../youth';
import { importYouthCsv } from './youth-importer';

const ACT_HEAD = 'Datum,Art der Aktivität,Details,Geistiger Gedanke / Klasse:,Thema,Aktivität JD,Leitung JD:,Aktivität JM,Leitung JM:,Anwesende Erw.,Abwesende Erw.,Snack';
const CLS_HEAD = 'Datum,Details,Thema,Geistiger Gedanke / Klasse:,Anwesende Erw.,Abwesende Erw.,Leitung JM:,Leitung JD:';
const activities = [
	ACT_HEAD,
	'10/14/2026,Aktivitäten Pratteln JD AP,"Treffpunkt, Kirche","JD: Mia,JM: Urs",Glaube,Spiele,Mia,Fussball,Urs,Vreni,Widmer,Znüni',
	'10/21/2026,JD/AP Pratteln gemeinsam,,"JD: Mia, JM: Urs",,"Kochen\nund backen",Lea,,Reto,,,',
	'10/23/2026,Pfahl-Aktivität,"Pfahlball",,,,,,,,,',
	'10/28/2026,Keine Aktivität,Schulferien,,,,,,,,,',
	'11/04/2026,Gemeinsam mit Basel,,"JD: Vreni",,,Vreni,,,,,'
].join('\n');
const classes = [CLS_HEAD, '10/18/2026,,,"JD: Mia,JM: Urs",Vreni,,Priester Kollegium,JD des Glaubens', '10/25/2026,,,,,,Leitung,Leitung'].join('\n');

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
	for (const [f, l, side, group] of [['Mia', 'Dürst', 'jd', 'glauben'], ['Lea', 'Rey', 'jd', 'licht'], ['Urs', 'Koller', 'jm', 'priester'], ['Reto', 'Gasser', 'jm', 'lehrer']] as const) {
		setYouth(db, createMember(db, { firstName: f, lastName: l }).id, side, group);
	}
	setBishopricMember(db, 'bischof', createMember(db, { firstName: 'Vreni', lastName: 'Baumann' }).id);
});

describe('importYouthCsv', () => {
	it('maps activity kinds, joint and texts', () => {
		const r = importYouthCsv(db, activities, classes);
		expect(r.events).toBe(6);
		const a = loadYouthEvent(db, '2026-10-14')!;
		expect(a.event).toMatchObject({ kind: 'aktivitaet', joint: false, details: 'Treffpunkt, Kirche', topic: 'Glaube', snack: 'Znüni' });
		expect(a.parts.map((p) => [p.side, p.text])).toEqual([['jd', 'Spiele'], ['jm', 'Fussball']]);
		const j = loadYouthEvent(db, '2026-10-21')!;
		expect(j.event.joint).toBe(true);
		expect(j.parts.map((p) => [p.side, p.text, p.leader?.firstName, p.thought?.firstName])).toEqual([['both', 'Kochen\nund backen', 'Lea', 'Mia']]);
		expect(loadYouthEvent(db, '2026-10-28')!.event.kind).toBe('ferien');
		const c = loadYouthEvent(db, '2026-10-18')!;
		expect(c.parts.map((p) => [p.side, p.leaderGroup, p.thought?.firstName])).toEqual([['jd', 'glauben', 'Mia'], ['jm', 'priester', 'Urs']]);
	});

	it('resolves first names per side and warns on unknown', () => {
		const r = importYouthCsv(db, activities, classes);
		const a = loadYouthEvent(db, '2026-10-14')!;
		expect(a.parts.map((p) => p.leader?.firstName)).toEqual(['Mia', 'Urs']);
		expect(a.adults.map((x) => [x.member.firstName, x.present])).toEqual([['Vreni', true]]);
		const b = loadYouthEvent(db, '2026-11-04')!;
		expect(b.event.kind).toBe('basel');
		expect(b.event.joint).toBe(true);
		expect(b.event.details).toBe('Geistiger Gedanke JD: Vreni\nLeitung JD: Vreni');
		expect(r.warnings).toEqual(expect.arrayContaining([
			"2026-11-04: Geistiger Gedanke JD 'Vreni' nicht gefunden",
			"2026-11-04: Leitung JD 'Vreni' nicht gefunden",
			"2026-10-14: Abwesende Erw. 'Widmer' nicht gefunden"
		]));
	});

	it('reads a missing column as empty and warns once', () => {
		const csv = ACT_HEAD.replace(',Leitung JM:', '') + '\n10/14/2026,Aktivitäten Pratteln JD AP,,,,Spiele,Mia,Fussball,,,';
		const r = importYouthCsv(db, csv, classes);
		expect(r.warnings.filter((w) => w.includes('Leitung JM'))).toEqual(["Spalte 'Leitung JM' fehlt in den Aktivitäten"]);
		expect(loadYouthEvent(db, '2026-10-14')!.parts.map((p) => p.leader?.firstName ?? null)).toEqual(['Mia', null]);
	});

	it('turns a Friday stake row into a break', () => {
		const r = importYouthCsv(db, activities, classes);
		expect(r.breaks).toBe(1);
		expect(listBreaks(db).map((b) => [b.fromDate, b.toDate, b.kind, b.label])).toEqual([['2026-10-23', '2026-10-23', 'pfahl', 'Pfahlball']]);
	});

	it('re-import overwrites', () => {
		importYouthCsv(db, activities, classes);
		const changed = activities.replace('Znüni', 'Pizza').replace(',Vreni,', ',,');
		importYouthCsv(db, changed, classes);
		const a = loadYouthEvent(db, '2026-10-14')!;
		expect(a.event.snack).toBe('Pizza');
		expect(a.adults).toEqual([]);
		expect(a.parts).toHaveLength(2);
		expect(listBreaks(db)).toHaveLength(1);
	});
});
