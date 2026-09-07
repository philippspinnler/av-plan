import { describe, expect, it } from 'vitest';
import {
	addDays, addMonths, formatDateDe, formatDateShort, isSunday, nextSundayIso,
	sundaysBetween, todayIso, weeksBetween
} from './dates';

describe('dates', () => {
	it('erkennt Sonntage', () => {
		expect(isSunday('2026-09-13')).toBe(true);
		expect(isSunday('2026-09-14')).toBe(false);
	});
	it('addiert Tage und Monate', () => {
		expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
		expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
		expect(addMonths('2026-09-07', 12)).toBe('2027-09-07');
	});
	it('findet den nächsten Sonntag', () => {
		expect(nextSundayIso('2026-09-07')).toBe('2026-09-13');
		expect(nextSundayIso('2026-09-13')).toBe('2026-09-13');
	});
	it('listet Sonntage inklusive Grenzen', () => {
		expect(sundaysBetween('2026-09-07', '2026-09-27')).toEqual(['2026-09-13', '2026-09-20', '2026-09-27']);
	});
	it('zählt ganze Wochen', () => {
		expect(weeksBetween('2026-08-30', '2026-09-13')).toBe(2);
		expect(weeksBetween('2026-08-30', '2026-09-12')).toBe(1);
	});
	it('formatiert deutsch', () => {
		expect(formatDateDe('2026-09-13')).toBe('So, 13.09.2026');
		expect(formatDateShort('2026-09-13')).toBe('13.09.2026');
	});
	it('todayIso nutzt lokale Kalenderdaten', () => {
		expect(todayIso(new Date(2026, 8, 7, 23, 30))).toBe('2026-09-07');
	});
});
