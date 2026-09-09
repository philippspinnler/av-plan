import { describe, expect, it } from 'vitest';
import { createDb } from './db';
import { askTables } from './fragen';
import { createMember } from './members';
import { createMeeting, savePrayers, saveTalks } from './meetings';
import { ensureStakeCalling } from './stake-callings';

const TODAY = '2026-09-07';

describe('askTables', () => {
	it('trennt Ansprachen und Gebete, lässt "möchte nicht", Inaktive und Pfahl bei Gebeten weg', () => {
		const db = createDb(':memory:');
		const anna = createMember(db, { firstName: 'Anna', lastName: 'Rey' });
		const beat = createMember(db, { firstName: 'Beat', lastName: 'Fischer', noTalk: true, notePrayer: 'gerne' });
		createMember(db, { firstName: 'Carla', lastName: 'Hofer', active: false });
		createMember(db, { firstName: 'Dora', lastName: 'Arnold', noPrayer: true });
		const hr = ensureStakeCalling(db, 'Hoherat');
		createMember(db, { firstName: 'Emil', lastName: 'Nef', kind: 'pfahl', stakeCallingId: hr.id });
		const past = createMeeting(db, '2026-08-30');
		saveTalks(db, past.id, [{ position: 1, memberId: anna.id, topic: 'T', durationMinutes: 5, status: 'zugesagt', note: null }]);
		savePrayers(db, past.id, [{ position: 1, memberId: beat.id, status: 'zugesagt' }]);
		const future = createMeeting(db, '2026-09-20');
		savePrayers(db, future.id, [{ position: 2, memberId: anna.id, status: 'angefragt' }]);

		const t = askTables(db, TODAY);
		expect(t.talks.map((r) => r.name)).toEqual(['Dora Arnold', 'Emil Nef (Hoherat)', 'Anna Rey']);
		expect(t.talks.find((r) => r.name === 'Anna Rey')).toMatchObject({ lastDate: '2026-08-30', label: 'vor 1 Woche', nextDate: null, planned: false });
		expect(t.prayers.map((r) => r.name)).toEqual(['Beat Fischer', 'Anna Rey']);
		expect(t.prayers.find((r) => r.name === 'Anna Rey')).toMatchObject({ lastDate: null, nextDate: '2026-09-20', label: 'nächste Woche', planned: true });
		expect(t.prayers.find((r) => r.name === 'Beat Fischer')).toMatchObject({ lastDate: '2026-08-30', note: 'gerne' });
	});
});
