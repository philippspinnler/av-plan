import { describe, expect, it } from 'vitest';
import { cellDateIso, cellNumber, cellSeconds, cellText, isIgnoredToken, parseSpecial, parseTalk } from './parse';

describe('Zellen', () => {
	it('cellText', () => {
		expect(cellText(' Anna ')).toBe('Anna');
		expect(cellText(42)).toBe('42');
		expect(cellText({ richText: [{ text: 'PV ' }, { text: 'singt' }] })).toBe('PV singt');
		expect(cellText({ formula: 'A1', result: 'x' })).toBe('x');
		expect(cellText({ error: '#N/A' })).toBe('');
		expect(cellText(null)).toBe('');
	});
	it('cellNumber', () => {
		expect(cellNumber(129)).toBe(129);
		expect(cellNumber(129.0)).toBe(129);
		expect(cellNumber('1001')).toBe(1001);
		expect(cellNumber('PV')).toBeNull();
		expect(cellNumber({ formula: 'x', result: 7 })).toBe(7);
	});
	it('cellDateIso', () => {
		expect(cellDateIso(new Date(Date.UTC(2026, 8, 13)))).toBe('2026-09-13');
		expect(cellDateIso(46278)).toBe('2026-09-13');
		expect(cellDateIso('13.09.2026')).toBe('2026-09-13');
		expect(cellDateIso('Fastsonntag')).toBeNull();
	});
	it('cellSeconds', () => {
		expect(cellSeconds(new Date(Date.UTC(1899, 11, 30, 0, 4, 10)))).toBe(250);
		expect(cellSeconds(250 / 86400)).toBe(250);
		expect(cellSeconds('4:10')).toBe(250);
		expect(cellSeconds(0)).toBeNull();
		expect(cellSeconds(null)).toBeNull();
	});
	it('isIgnoredToken', () => {
		for (const t of ['-', 'PV', '#N/A', 'nn', '!', 'Orgel', '']) expect(isIgnoredToken(t)).toBe(true);
		expect(isIgnoredToken('Vreni')).toBe(false);
	});
});

describe('parseSpecial', () => {
	it('erkennt Typen und behält den Rest als Notiz', () => {
		expect(parseSpecial('')).toEqual({ kind: 'normal', note: null });
		expect(parseSpecial('Fastsonntag')).toEqual({ kind: 'fastsonntag', note: null });
		expect(parseSpecial('Fastsonntag?')).toEqual({ kind: 'fastsonntag', note: null });
		expect(parseSpecial('Faststonntag')).toEqual({ kind: 'fastsonntag', note: null });
		expect(parseSpecial('Fastsonntag, Kindersegnung Koller')).toEqual({ kind: 'fastsonntag', note: 'Kindersegnung Koller' });
		expect(parseSpecial('Generalkonferenz/Fastsonntag')).toEqual({ kind: 'generalkonferenz', note: 'Fastsonntag' });
		expect(parseSpecial('Pfahlkonferenz')).toEqual({ kind: 'pfahlkonferenz', note: null });
		expect(parseSpecial('Gemeindekonferenz')).toEqual({ kind: 'gemeindekonferenz', note: null });
		expect(parseSpecial('Weihnachten / nur AV')).toEqual({ kind: 'weihnachten', note: 'nur AV' });
		expect(parseSpecial('Ostern')).toEqual({ kind: 'ostern', note: null });
		expect(parseSpecial('DKA')).toEqual({ kind: 'dka', note: null });
		expect(parseSpecial('FHV, Kindersegnung')).toEqual({ kind: 'fhv', note: 'Kindersegnung' });
		expect(parseSpecial('ÄK')).toEqual({ kind: 'aek', note: null });
		expect(parseSpecial('JD')).toEqual({ kind: 'jd', note: null });
		expect(parseSpecial('Fastsonntag, JM')).toEqual({ kind: 'jm', note: 'Fastsonntag' });
		expect(parseSpecial('Objdekt')).toEqual({ kind: 'normal', note: 'Objdekt' });
		expect(parseSpecial('Weihnachtsversammlung')).toEqual({ kind: 'weihnachten', note: null });
	});
});

describe('parseTalk', () => {
	it('liest Status-Marker aus dem Thema', () => {
		expect(parseTalk('Anna Rey', 'Confirm', false)).toEqual({ name: 'Anna Rey', topic: null, status: 'angefragt', durationMinutes: null, note: null });
		expect(parseTalk('Anna Rey', 'Einladen', false)).toEqual({ name: 'Anna Rey', topic: null, status: 'offen', durationMinutes: null, note: null });
		expect(parseTalk('Anna Rey', 'Rückfrage??', false)).toEqual({ name: 'Anna Rey', topic: null, status: 'zugesagt', durationMinutes: null, note: 'Rückfrage??' });
		expect(parseTalk('Anna Rey', 'Nächstenliebe', false)).toEqual({ name: 'Anna Rey', topic: 'Nächstenliebe', status: 'zugesagt', durationMinutes: null, note: null });
		expect(parseTalk('Anna Rey', 'Confirm', true)).toEqual({ name: 'Anna Rey', topic: null, status: 'zugesagt', durationMinutes: null, note: null });
		expect(parseTalk('-', '', true)).toEqual({ name: null, topic: null, status: 'zugesagt', durationMinutes: null, note: null });
	});
	it('liest Dauer-Marken aus Namens- oder Themenfeld und ignoriert Kürzel', () => {
		expect(parseTalk("15' Lena Hasler", '', true)).toEqual({ name: 'Lena Hasler', topic: null, status: 'zugesagt', durationMinutes: 15, note: null });
		expect(parseTalk("Andrin Steiner 5'", 'Glaube', false)).toEqual({ name: 'Andrin Steiner', topic: 'Glaube', status: 'zugesagt', durationMinutes: 5, note: null });
		expect(parseTalk('GK', '', true)).toEqual({ name: null, topic: null, status: 'zugesagt', durationMinutes: null, note: null });
	});
});
