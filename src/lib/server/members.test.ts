import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './db';
import { createMember, displayName, findMemberByName, listMembers, matchByFirstName, matchMember, updateMember } from './members';

let db: Db;
beforeEach(() => {
	db = createDb(':memory:');
	createMember(db, { firstName: 'Anna', lastName: 'Rey' });
	createMember(db, { firstName: 'Daniel', lastName: 'Dürst', affiliation: 'Hoherat' });
	createMember(db, { firstName: 'Edith', lastName: 'Achermann', active: false });
	createMember(db, { firstName: 'Thomas', lastName: 'Koller' });
	createMember(db, { firstName: 'Thomas', lastName: 'Moser' });
});

describe('members', () => {
	it('listet sortiert und filtert aktive', () => {
		expect(listMembers(db).map((m) => m.lastName)).toEqual(['Achermann', 'Dürst', 'Koller', 'Moser', 'Rey']);
		expect(listMembers(db, { activeOnly: true }).map((m) => m.lastName)).toEqual(['Dürst', 'Koller', 'Moser', 'Rey']);
	});
	it('zeigt Zugehörigkeit im Anzeigenamen', () => {
		const d = findMemberByName(db, 'HR-Daniel Dürst');
		expect(d && displayName(d)).toBe('Daniel Dürst (Hoherat)');
		expect(displayName({ firstName: 'Anna', lastName: 'Rey', affiliation: null })).toBe('Anna Rey');
		expect(displayName({ firstName: 'Simon', lastName: 'Dürst', affiliation: null, calling: '1. Ratgeber Pfahlpräsidentschaft' })).toBe('Simon Dürst (1. Ratgeber Pfahlpräsidentschaft)');
		const stake = createMember(db, { firstName: 'Stefan', lastName: 'Landolt', kind: 'pfahl', calling: 'Hoherat' });
		expect(listMembers(db, { kind: 'pfahl' }).map((m) => m.id)).toEqual([stake.id]);
		expect(listMembers(db, { kind: 'gemeinde' })).toHaveLength(5);
	});
	it('findet per Name in beiden Schreibweisen, ignoriert Präfix', () => {
		expect(findMemberByName(db, 'anna rey')?.firstName).toBe('Anna');
		expect(findMemberByName(db, 'Rey, Anna')?.firstName).toBe('Anna');
		expect(findMemberByName(db, 'Durst Daniel')).toBeNull();
		expect(findMemberByName(db, 'Unbekannt Person')).toBeNull();
	});
	it('matchByFirstName ist nur bei eindeutigem aktivem Treffer gesetzt', () => {
		const all = listMembers(db);
		expect(matchByFirstName(all, 'Anna')?.lastName).toBe('Rey');
		expect(matchByFirstName(all, 'Thomas')).toBeNull();
		expect(matchByFirstName(all, 'Edith')).toBeNull();
		expect(matchMember(all, 'Koller Thomas')).toBeNull();
		expect(matchMember(all, 'Thomas Koller')?.lastName).toBe('Koller');
	});
	it('aktualisiert Felder', () => {
		const a = findMemberByName(db, 'Anna Rey')!;
		updateMember(db, a.id, { active: false, noteTalk: 'gerne kurz' });
		const again = listMembers(db).find((m) => m.id === a.id)!;
		expect(again.active).toBe(false);
		expect(again.noteTalk).toBe('gerne kurz');
	});
});
