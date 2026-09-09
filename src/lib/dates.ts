const DAY_MS = 86_400_000;
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function parseIso(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(d: Date): string {
	return d.toISOString().slice(0, 10);
}

export function isSunday(iso: string): boolean {
	return parseIso(iso).getUTCDay() === 0;
}

export function addDays(iso: string, n: number): string {
	return toIso(new Date(parseIso(iso).getTime() + n * DAY_MS));
}

export function addMonths(iso: string, n: number): string {
	const d = parseIso(iso);
	const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n + 1, 0));
	const day = Math.min(d.getUTCDate(), target.getUTCDate());
	return toIso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, day)));
}

export function todayIso(now: Date = new Date()): string {
	return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function nextSundayIso(iso: string): string {
	const diff = (7 - parseIso(iso).getUTCDay()) % 7;
	return addDays(iso, diff);
}

export function sundaysBetween(from: string, to: string): string[] {
	const out: string[] = [];
	for (let s = nextSundayIso(from); s <= to; s = addDays(s, 7)) out.push(s);
	return out;
}

export function weeksBetween(from: string, to: string): number {
	return Math.floor((parseIso(to).getTime() - parseIso(from).getTime()) / (7 * DAY_MS));
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDateShort(iso: string): string {
	const d = parseIso(iso);
	return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

export function formatDateDe(iso: string): string {
	return `${WEEKDAYS[parseIso(iso).getUTCDay()]}, ${formatDateShort(iso)}`;
}

/** z.B. "Sonntag, 13. September 2026" */
export function formatDateLong(iso: string): string {
	const d = parseIso(iso);
	return `${WEEKDAYS_LONG[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
