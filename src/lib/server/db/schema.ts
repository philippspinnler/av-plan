import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const ROLES = ['admin', 'bischofschaft', 'musik'] as const;
export type Role = (typeof ROLES)[number];
export const MEETING_KINDS = ['normal', 'fastsonntag', 'generalkonferenz', 'pfahlkonferenz', 'gemeindekonferenz', 'keine'] as const;
export type MeetingKind = (typeof MEETING_KINDS)[number];
export const STATUSES = ['offen', 'angefragt', 'zugesagt'] as const;
export type Status = (typeof STATUSES)[number];
export const HYMN_SLOTS = ['anfang', 'abendmahl', 'zwischen', 'schluss'] as const;
export type HymnSlot = (typeof HYMN_SLOTS)[number];
export const CALLING_KINDS = ['entlassung', 'berufung'] as const;
export type CallingKind = (typeof CALLING_KINDS)[number];

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
const timestamps = {
	createdAt: text('created_at').notNull().default(now),
	updatedAt: text('updated_at').notNull().default(now)
};

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	role: text('role', { enum: ROLES }).notNull(),
	passwordHash: text('password_hash').notNull(),
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	...timestamps
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: text('expires_at').notNull(),
	createdAt: text('created_at').notNull().default(now)
});

export const invites = sqliteTable('invites', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	token: text('token').notNull().unique(),
	email: text('email').notNull(),
	name: text('name').notNull(),
	role: text('role', { enum: ROLES }).notNull(),
	createdBy: integer('created_by').notNull().references(() => users.id),
	expiresAt: text('expires_at').notNull(),
	usedAt: text('used_at'),
	createdAt: text('created_at').notNull().default(now)
});

export const loginAttempts = sqliteTable('login_attempts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull(),
	attemptedAt: text('attempted_at').notNull(),
	success: integer('success', { mode: 'boolean' }).notNull()
});

export const members = sqliteTable('members', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	affiliation: text('affiliation'),
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	noteTalk: text('note_talk'),
	notePrayer: text('note_prayer'),
	...timestamps
});

export const hymns = sqliteTable('hymns', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	number: integer('number').notNull().unique(),
	title: text('title').notNull(),
	book: text('book', { enum: ['gesangbuch', 'neu'] }).notNull(),
	durationSeconds: integer('duration_seconds'),
	...timestamps
});

export const meetings = sqliteTable('meetings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: text('date').notNull().unique(),
	kind: text('kind', { enum: MEETING_KINDS }).notNull().default('normal'),
	theme: text('theme'),
	specialNote: text('special_note'),
	presidingMemberId: integer('presiding_member_id').references(() => members.id),
	absences: text('absences'),
	organistMemberId: integer('organist_member_id').references(() => members.id),
	conductorMemberId: integer('conductor_member_id').references(() => members.id),
	talksStartTime: text('talks_start_time'),
	musicNote: text('music_note'),
	...timestamps
});

export const meetingPrayers = sqliteTable(
	'meeting_prayers',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		meetingId: integer('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
		memberId: integer('member_id').references(() => members.id),
		status: text('status', { enum: STATUSES }).notNull().default('offen')
	},
	(t) => [uniqueIndex('meeting_prayers_pos').on(t.meetingId, t.position)]
);

export const meetingTalks = sqliteTable(
	'meeting_talks',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		meetingId: integer('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
		memberId: integer('member_id').references(() => members.id),
		topic: text('topic'),
		durationMinutes: integer('duration_minutes'),
		status: text('status', { enum: STATUSES }).notNull().default('offen'),
		note: text('note')
	},
	(t) => [uniqueIndex('meeting_talks_pos').on(t.meetingId, t.position)]
);

export const meetingHymns = sqliteTable(
	'meeting_hymns',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		meetingId: integer('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
		slot: text('slot', { enum: HYMN_SLOTS }).notNull(),
		hymnId: integer('hymn_id').references(() => hymns.id),
		freeText: text('free_text')
	},
	(t) => [uniqueIndex('meeting_hymns_slot').on(t.meetingId, t.slot)]
);

export const announcements = sqliteTable('announcements', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	meetingId: integer('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(),
	text: text('text').notNull()
});

export const callings = sqliteTable('callings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	meetingId: integer('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(),
	kind: text('kind', { enum: CALLING_KINDS }).notNull(),
	personName: text('person_name').notNull(),
	calling: text('calling').notNull()
});

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

export type User = typeof users.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Hymn = typeof hymns.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Invite = typeof invites.$inferSelect;
