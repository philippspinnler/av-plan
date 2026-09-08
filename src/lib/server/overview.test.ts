import { describe, expect, it } from 'vitest';
import { createDb } from './db';
import { createMember } from './members';
import { createMeeting, loadMeetingFullByDate, saveTalks } from './meetings';
import { overviewRange, summarize } from './overview';

describe('overview', () => {
	it('overviewRange', () => {
		expect(overviewRange('2026-09-07', null)).toEqual({ from: '2026-09-06', to: '2026-11-30' });
		expect(overviewRange('2026-09-07', 2027)).toEqual({ from: '2027-01-01', to: '2027-12-31' });
	});
	it('summarize', () => {
		const db = createDb(':memory:');
		const anna = createMember(db, { firstName: 'Anna', lastName: 'Rey' });
		const m = createMeeting(db, '2026-09-13');
		saveTalks(db, m.id, [{ position: 1, memberId: anna.id, topic: 'Liebe', durationMinutes: 5, status: 'zugesagt', note: null }]);
		const s = summarize(loadMeetingFullByDate(db, '2026-09-13')!, { showProgram: true });
		expect(s.dateLabel).toBe('So, 13.09.2026');
		expect(s.kindLabel).toBe('Normal');
		expect(s.speakers).toEqual(['Anna Rey']);
		expect(s.missingProgram).toContain('Leitung');
		expect(s.missingMusic).toContain('Orgel');
	});
	it('summarize blendet das Programm für Musikrollen aus', () => {
		const db = createDb(':memory:');
		const anna = createMember(db, { firstName: 'Anna', lastName: 'Rey' });
		const m = createMeeting(db, '2026-09-13');
		saveTalks(db, m.id, [{ position: 1, memberId: anna.id, topic: 'Liebe', durationMinutes: 5, status: 'zugesagt', note: null }]);
		const s = summarize(loadMeetingFullByDate(db, '2026-09-13')!, { showProgram: false });
		expect(s.presiding).toBeNull();
		expect(s.speakers).toEqual([]);
		expect(s.missingProgram).toEqual([]);
		expect(s.missingMusic).toContain('Orgel');
	});
});
