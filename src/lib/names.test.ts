import { describe, expect, it } from 'vitest';
import { normalizeName, splitFullName, splitListName } from './names';

describe('normalizeName', () => {
	it('vereinheitlicht Umlaute, Gross-/Kleinschreibung und Leerzeichen', () => {
		expect(normalizeName('  Dürst,  Simon ')).toBe('durst simon');
		expect(normalizeName('Zoé Baumann')).toBe('zoe baumann');
		expect(normalizeName('Weiß')).toBe('weiss');
	});
});

describe('splitFullName', () => {
	it('trennt Vor- und Nachname', () => {
		expect(splitFullName('Anna Rey')).toEqual({ firstName: 'Anna', lastName: 'Rey', affiliation: null });
		expect(splitFullName('Ting Wai Gasser')).toEqual({ firstName: 'Ting Wai', lastName: 'Gasser', affiliation: null });
	});
	it('übersetzt Präfixe in Zugehörigkeit', () => {
		expect(splitFullName('HR-Daniel Dürst')).toEqual({ firstName: 'Daniel', lastName: 'Dürst', affiliation: 'Hoherat' });
		expect(splitFullName('PP-Simon Dürst')).toEqual({ firstName: 'Simon', lastName: 'Dürst', affiliation: 'Pfahlpräsidentschaft' });
		expect(splitFullName('HR Stefan Landolt')).toEqual({ firstName: 'Stefan', lastName: 'Landolt', affiliation: 'Hoherat' });
	});
	it('erkennt Missionare', () => {
		expect(splitFullName('Elder Neuer')).toEqual({ firstName: 'Elder', lastName: 'Neuer', affiliation: 'Missionar' });
		expect(splitFullName('Sister Smith')).toEqual({ firstName: 'Sister', lastName: 'Smith', affiliation: 'Missionar' });
	});
	it('kommt mit einem einzelnen Wort klar', () => {
		expect(splitFullName('Besucher')).toEqual({ firstName: 'Besucher', lastName: '', affiliation: null });
	});
});

describe('splitListName', () => {
	it('liest "Nachname, Vorname"', () => {
		expect(splitListName('Dürst, PP-Simon')).toEqual({ firstName: 'Simon', lastName: 'Dürst', affiliation: 'Pfahlpräsidentschaft' });
		expect(splitListName('Da Silva Santos, Maria')).toEqual({ firstName: 'Maria', lastName: 'Da Silva Santos', affiliation: null });
	});
	it('fällt ohne Komma auf splitFullName zurück', () => {
		expect(splitListName('Anna Rey')).toEqual({ firstName: 'Anna', lastName: 'Rey', affiliation: null });
	});
});
