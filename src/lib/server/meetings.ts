import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm';
import { addMonths, isSunday, sundaysBetween } from '../dates';
import type { Db } from './db';
import {
	announcements, callings, hymns, meetingHymns, meetingPrayers, meetingTalks, meetings, members,
	HYMN_SLOTS, type CallingKind, type Hymn, type HymnSlot, type Meeting, type MeetingKind, type Member, type Status
} from './db/schema';
import { getHymnByNumber } from './hymns';

export const KIND_LABELS: Record<MeetingKind, string> = {
	normal: 'Normal',
	fastsonntag: 'Fastsonntag',
	generalkonferenz: 'Generalkonferenz',
	pfahlkonferenz: 'Pfahlkonferenz',
	gemeindekonferenz: 'Gemeindekonferenz',
	keine: 'Keine Versammlung'
};
export const SLOT_LABELS: Record<HymnSlot, string> = {
	anfang: 'Anfangslied',
	abendmahl: 'Abendmahlslied',
	zwischen: 'Zwischenlied',
	schluss: 'Schlusslied'
};
export const STATUS_LABELS: Record<Status, string> = { offen: 'Offen', angefragt: 'Angefragt', zugesagt: 'Zugesagt' };

export function hasProgram(kind: MeetingKind): boolean {
	return kind === 'normal' || kind === 'fastsonntag' || kind === 'gemeindekonferenz';
}
export const countsForStats = hasProgram;

export interface PrayerRow { position: number; member: Member | null; status: Status }
export interface TalkRow { position: number; member: Member | null; topic: string | null; durationMinutes: number | null; status: Status; note: string | null }
export interface CallingRow { kind: CallingKind; personName: string; calling: string }
export interface MeetingFull {
	meeting: Meeting;
	presiding: Member | null;
	organist: Member | null;
	conductor: Member | null;
	prayers: PrayerRow[];
	talks: TalkRow[];
	hymns: Record<HymnSlot, { hymn: Hymn | null; freeText: string | null }>;
	announcements: string[];
	callings: CallingRow[];
}
export interface PrayerInput { position: number; memberId: number | null; status: Status }
export interface TalkInput { position: number; memberId: number | null; topic: string | null; durationMinutes: number | null; status: Status; note: string | null }

const nowIso = () => new Date().toISOString();

export function createMeeting(db: Db, date: string): Meeting {
	if (!isSunday(date)) throw new Error('Datum ist kein Sonntag');
	return db.insert(meetings).values({ date }).returning().get();
}

export function getMeetingByDate(db: Db, date: string): Meeting | undefined {
	return db.select().from(meetings).where(eq(meetings.date, date)).get();
}

export function ensureSundays(db: Db, fromIso: string, months = 12): number {
	const wanted = sundaysBetween(fromIso, addMonths(fromIso, months));
	const existing = new Set(
		db.select({ date: meetings.date }).from(meetings).where(inArray(meetings.date, wanted)).all().map((r) => r.date)
	);
	let created = 0;
	db.transaction((tx) => {
		for (const date of wanted) {
			if (existing.has(date)) continue;
			tx.insert(meetings).values({ date }).run();
			created++;
		}
	});
	return created;
}

function membersById(db: Db, ids: (number | null | undefined)[]): Map<number, Member> {
	const wanted = [...new Set(ids.filter((x): x is number => typeof x === 'number'))];
	const map = new Map<number, Member>();
	if (wanted.length === 0) return map;
	for (const m of db.select().from(members).where(inArray(members.id, wanted)).all()) map.set(m.id, m);
	return map;
}

function assemble(db: Db, meeting: Meeting): MeetingFull {
	const prayerRows = db.select().from(meetingPrayers).where(eq(meetingPrayers.meetingId, meeting.id)).orderBy(asc(meetingPrayers.position)).all();
	const talkRows = db.select().from(meetingTalks).where(eq(meetingTalks.meetingId, meeting.id)).orderBy(asc(meetingTalks.position)).all();
	const hymnRows = db
		.select({ slot: meetingHymns.slot, freeText: meetingHymns.freeText, hymn: hymns })
		.from(meetingHymns)
		.leftJoin(hymns, eq(hymns.id, meetingHymns.hymnId))
		.where(eq(meetingHymns.meetingId, meeting.id))
		.all();
	const annRows = db.select().from(announcements).where(eq(announcements.meetingId, meeting.id)).orderBy(asc(announcements.position)).all();
	const callRows = db.select().from(callings).where(eq(callings.meetingId, meeting.id)).orderBy(asc(callings.position)).all();
	const people = membersById(db, [
		meeting.presidingMemberId, meeting.organistMemberId, meeting.conductorMemberId,
		...prayerRows.map((p) => p.memberId), ...talkRows.map((t) => t.memberId)
	]);
	const pick = (id: number | null) => (id === null ? null : (people.get(id) ?? null));
	const hymnMap = Object.fromEntries(HYMN_SLOTS.map((s) => [s, { hymn: null, freeText: null }])) as MeetingFull['hymns'];
	for (const r of hymnRows) hymnMap[r.slot] = { hymn: r.hymn ?? null, freeText: r.freeText };
	return {
		meeting,
		presiding: pick(meeting.presidingMemberId),
		organist: pick(meeting.organistMemberId),
		conductor: pick(meeting.conductorMemberId),
		prayers: prayerRows.map((p) => ({ position: p.position, member: pick(p.memberId), status: p.status })),
		talks: talkRows.map((t) => ({ position: t.position, member: pick(t.memberId), topic: t.topic, durationMinutes: t.durationMinutes, status: t.status, note: t.note })),
		hymns: hymnMap,
		announcements: annRows.map((a) => a.text),
		callings: callRows.map((c) => ({ kind: c.kind, personName: c.personName, calling: c.calling }))
	};
}

export function listMeetings(db: Db, from: string, to: string): MeetingFull[] {
	return db
		.select().from(meetings)
		.where(and(gte(meetings.date, from), lte(meetings.date, to)))
		.orderBy(asc(meetings.date))
		.all()
		.map((m) => assemble(db, m));
}

export function loadMeetingFull(db: Db, meetingId: number): MeetingFull | null {
	const m = db.select().from(meetings).where(eq(meetings.id, meetingId)).get();
	return m ? assemble(db, m) : null;
}

export function loadMeetingFullByDate(db: Db, date: string): MeetingFull | null {
	const m = getMeetingByDate(db, date);
	return m ? assemble(db, m) : null;
}

export function saveGeneral(
	db: Db,
	meetingId: number,
	input: { kind: MeetingKind; theme: string | null; specialNote: string | null; presidingMemberId: number | null; absences: string | null }
): void {
	db.update(meetings).set({ ...input, updatedAt: nowIso() }).where(eq(meetings.id, meetingId)).run();
}

export function savePrayers(db: Db, meetingId: number, prayers: PrayerInput[]): void {
	db.transaction((tx) => {
		tx.delete(meetingPrayers).where(eq(meetingPrayers.meetingId, meetingId)).run();
		for (const p of prayers) tx.insert(meetingPrayers).values({ meetingId, ...p }).run();
		tx.update(meetings).set({ updatedAt: nowIso() }).where(eq(meetings.id, meetingId)).run();
	});
}

export function saveTalks(db: Db, meetingId: number, talks: TalkInput[], talksStartTime: string | null): void {
	db.transaction((tx) => {
		tx.delete(meetingTalks).where(eq(meetingTalks.meetingId, meetingId)).run();
		for (const t of talks) tx.insert(meetingTalks).values({ meetingId, ...t }).run();
		tx.update(meetings).set({ talksStartTime, updatedAt: nowIso() }).where(eq(meetings.id, meetingId)).run();
	});
}

export function saveAnnouncements(db: Db, meetingId: number, texts: string[]): void {
	db.transaction((tx) => {
		tx.delete(announcements).where(eq(announcements.meetingId, meetingId)).run();
		texts.forEach((text, i) => tx.insert(announcements).values({ meetingId, position: i + 1, text }).run());
	});
}

export function saveCallings(db: Db, meetingId: number, items: CallingRow[]): void {
	db.transaction((tx) => {
		tx.delete(callings).where(eq(callings.meetingId, meetingId)).run();
		items.forEach((c, i) => tx.insert(callings).values({ meetingId, position: i + 1, ...c }).run());
	});
}

export function saveMusic(
	db: Db,
	meetingId: number,
	input: {
		hymns: Record<HymnSlot, { hymnNumber: number | null; freeText: string | null }>;
		organistMemberId: number | null;
		conductorMemberId: number | null;
		musicNote: string | null;
	}
): { unknownNumbers: number[] } {
	const meeting = db.select().from(meetings).where(eq(meetings.id, meetingId)).get();
	const isFastsonntag = meeting?.kind === 'fastsonntag';
	const unknownNumbers: number[] = [];
	db.transaction((tx) => {
		tx.delete(meetingHymns).where(eq(meetingHymns.meetingId, meetingId)).run();
		for (const slot of HYMN_SLOTS) {
			if (slot === 'zwischen' && isFastsonntag) continue;
			const { hymnNumber, freeText } = input.hymns[slot];
			let hymnId: number | null = null;
			if (hymnNumber !== null) {
				const h = getHymnByNumber(db, hymnNumber);
				if (h) hymnId = h.id;
				else unknownNumbers.push(hymnNumber);
			}
			if (hymnId !== null || freeText) {
				tx.insert(meetingHymns).values({ meetingId, slot, hymnId, freeText: hymnId !== null ? null : freeText }).run();
			}
		}
		tx.update(meetings)
			.set({ organistMemberId: input.organistMemberId, conductorMemberId: input.conductorMemberId, musicNote: input.musicNote, updatedAt: nowIso() })
			.where(eq(meetings.id, meetingId))
			.run();
	});
	return { unknownNumbers };
}

export function saveConductor(db: Db, meetingId: number, conductorMemberId: number | null): void {
	db.update(meetings).set({ conductorMemberId, updatedAt: nowIso() }).where(eq(meetings.id, meetingId)).run();
}
