import { describe, expect, it } from 'vitest';
import { cellDateIso, cellNumber, cellSeconds, cellText, isIgnoredToken, parseSpezial, parseTalk } from './parse';

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

describe('parseSpezial', () => {
	it('erkennt Typen und behält den Rest als Notiz', () => {
		expect(parseSpezial('')).toEqual({ kind: 'normal', note: null });
		expect(parseSpezial('Fastsonntag')).toEqual({ kind: 'fastsonntag', note: null });
		expect(parseSpezial('Fastsonntag?')).toEqual({ kind: 'fastsonntag', note: null });
		expect(parseSpezial('Faststonntag')).toEqual({ kind: 'fastsonntag', note: null });
		expect(parseSpezial('Fastsonntag, Kindersegnung Koller')).toEqual({ kind: 'fastsonntag', note: 'Kindersegnung Koller' });
		expect(parseSpezial('Generalkonferenz/Fastsonntag')).toEqual({ kind: 'generalkonferenz', note: 'Fastsonntag' });
		expect(parseSpezial('Pfahlkonferenz')).toEqual({ kind: 'pfahlkonferenz', note: null });
		expect(parseSpezial('Gemeindekonferenz')).toEqual({ kind: 'gemeindekonferenz', note: null });
		expect(parseSpezial('Weihnachten / nur AV')).toEqual({ kind: 'normal', note: 'Weihnachten / nur AV' });
	});
});

describe('parseTalk', () => {
	it('liest Status-Marker aus dem Thema', () => {
		expect(parseTalk('Anna Rey', 'Confirm', false)).toEqual({ name: 'Anna Rey', topic: null, status: 'angefragt', note: null });
		expect(parseTalk('Anna Rey', 'Einladen', false)).toEqual({ name: 'Anna Rey', topic: null, status: 'offen', note: null });
		expect(parseTalk('Anna Rey', 'Rückfrage??', false)).toEqual({ name: 'Anna Rey', topic: null, status: 'zugesagt', note: 'Rückfrage??' });
		expect(parseTalk('Anna Rey', 'Nächstenliebe', false)).toEqual({ name: 'Anna Rey', topic: 'Nächstenliebe', status: 'zugesagt', note: null });
		expect(parseTalk('Anna Rey', 'Confirm', true)).toEqual({ name: 'Anna Rey', topic: null, status: 'zugesagt', note: null });
		expect(parseTalk('-', '', true)).toEqual({ name: null, topic: null, status: 'zugesagt', note: null });
	});
});
