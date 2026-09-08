import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formatDateDe, isSunday, todayIso } from '$lib/dates';
import { leadingInt } from '$lib/hymn-input';
import { HYMN_SLOTS, MEETING_KINDS, STATUSES, type HymnSlot, type MeetingKind, type Status } from '$lib/server/db/schema';
import { optInt, optStr, str, strList } from '$lib/server/forms';
import { hymnLabel, listHymns } from '$lib/server/hymns';
import { createMember, displayName, listMembers } from '$lib/server/members';
import {
	KIND_LABELS, SLOT_LABELS, createMeeting, getMeetingByDate, hasProgram, loadMeetingFullByDate,
	saveAnnouncements, saveCallings, saveConductor, saveGeneral, saveMusic, savePrayers, saveTalks, type TalkInput
} from '$lib/server/meetings';
import { can, requireRole } from '$lib/server/permissions';
import { memberOptions } from '$lib/server/picker';
import { getSetting } from '$lib/server/settings';
import { memberActivity } from '$lib/server/stats';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const isKind = (k: string): k is MeetingKind => (MEETING_KINDS as readonly string[]).includes(k);
const statusOf = (s: string): Status => ((STATUSES as readonly string[]).includes(s) ? (s as Status) : 'offen');

function checkDate(date: string) {
	if (!DATE.test(date) || !isSunday(date)) error(404, 'Kein gültiges Sonntagsdatum');
}

function meetingIdFor(locals: App.Locals, date: string): number {
	checkDate(date);
	const m = getMeetingByDate(locals.db, date);
	if (!m) error(404, 'Sonntag nicht gefunden');
	return m.id;
}

export const load: PageServerLoad = ({ locals, params, url }) => {
	const date = params.date;
	checkDate(date);
	const role = locals.user!.role;
	const showProgram = can(role, 'program.view');
	const canMusic = can(role, 'meeting.music');
	const canConductor = can(role, 'meeting.conductor');
	const base = {
		date,
		dateLabel: formatDateDe(date),
		showProgram,
		canMusic,
		canConductor,
		canPrint: showProgram,
		canCreate: can(role, 'meetings.create'),
		canAddMember: can(role, 'members.create')
	};
	const full = loadMeetingFullByDate(locals.db, date);
	if (!full) return { ...base, missing: true as const };

	const today = todayIso();
	const all = listMembers(locals.db);
	const stats = can(role, 'members.stats');
	const activity = stats ? memberActivity(locals.db, today) : new Map();
	const showFourth = url.searchParams.get('vier') === '1' || full.talks.some((t) => t.position === 4);
	const positions = showFourth ? [1, 2, 3, 4] : [1, 2, 3];
	const emptyTalk = (position: number) => ({ position, member: null, topic: null, durationMinutes: null, status: 'offen' as Status, note: null });
	const kind = full.meeting.kind;
	const hymnSlots = HYMN_SLOTS.filter((slot) => slot !== 'zwischen' || kind !== 'fastsonntag');

	return {
		...base,
		missing: false as const,
		meeting: {
			id: full.meeting.id,
			kind: full.meeting.kind,
			theme: full.meeting.theme,
			specialNote: full.meeting.specialNote,
			musicNote: full.meeting.musicNote,
			organistMemberId: full.meeting.organistMemberId,
			conductorMemberId: full.meeting.conductorMemberId,
			...(showProgram
				? {
						absences: full.meeting.absences,
						talksStartTime: full.meeting.talksStartTime ?? getSetting(locals.db, 'talks_start_time_default'),
						presidingMemberId: full.meeting.presidingMemberId
					}
				: {})
		},
		hasProgram: hasProgram(full.meeting.kind),
		kinds: MEETING_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] })),
		statuses: STATUSES.map((s) => ({ value: s, label: { offen: 'Offen', angefragt: 'Angefragt', zugesagt: 'Zugesagt' }[s] })),
		presidingName: showProgram && full.presiding ? displayName(full.presiding) : null,
		organistName: full.organist ? displayName(full.organist) : null,
		conductorName: full.conductor ? displayName(full.conductor) : null,
		presidingOptions: showProgram ? memberOptions(all, activity, 'plain', today, full.meeting.presidingMemberId) : [],
		organistOptions: memberOptions(all, activity, 'plain', today, full.meeting.organistMemberId),
		conductorOptions: memberOptions(all, activity, 'plain', today, full.meeting.conductorMemberId),
		prayers: showProgram
			? [1, 2].map((position) => {
					const p = full.prayers.find((x) => x.position === position) ?? { position, member: null, status: 'offen' as Status };
					return {
						position,
						label: position === 1 ? 'Anfangsgebet' : 'Schlussgebet',
						memberId: p.member?.id ?? null,
						memberName: p.member ? displayName(p.member) : null,
						status: p.status,
						options: memberOptions(all, activity, stats ? 'prayer' : 'plain', today, p.member?.id ?? null)
					};
				})
			: [],
		talks: showProgram
			? positions.map((position) => {
					const t = full.talks.find((x) => x.position === position) ?? emptyTalk(position);
					return {
						position,
						memberId: t.member?.id ?? null,
						memberName: t.member ? displayName(t.member) : null,
						topic: t.topic,
						durationMinutes: t.durationMinutes,
						status: t.status,
						note: t.note,
						options: memberOptions(all, activity, stats ? 'talk' : 'plain', today, t.member?.id ?? null)
					};
				})
			: [],
		showFourth,
		hymns: hymnSlots.map((slot) => {
			const h = full.hymns[slot];
			return { slot, label: SLOT_LABELS[slot], value: h.hymn ? hymnLabel(h.hymn) : '', freeText: h.freeText };
		}),
		hymnList: listHymns(locals.db).map((h) => hymnLabel(h)),
		announcements: showProgram ? full.announcements : [],
		releases: showProgram ? full.callings.filter((c) => c.kind === 'entlassung') : [],
		sustainings: showProgram ? full.callings.filter((c) => c.kind === 'berufung') : []
	};
};

export const actions: Actions = {
	create: ({ locals, params }) => {
		requireRole(locals.user, 'meetings.create');
		checkDate(params.date);
		if (!getMeetingByDate(locals.db, params.date)) createMeeting(locals.db, params.date);
		return { saved: 'create' };
	},
	general: async ({ request, locals, params }) => {
		requireRole(locals.user, 'meeting.program');
		const id = meetingIdFor(locals, params.date);
		const fd = await request.formData();
		const kind = str(fd, 'kind');
		if (!isKind(kind)) return fail(400, { error: 'Ungültiger Typ.' });
		saveGeneral(locals.db, id, {
			kind,
			theme: optStr(fd, 'theme'),
			specialNote: optStr(fd, 'specialNote'),
			presidingMemberId: optInt(fd, 'presiding'),
			absences: optStr(fd, 'absences')
		});
		return { saved: 'general' };
	},
	prayers: async ({ request, locals, params }) => {
		requireRole(locals.user, 'meeting.program');
		const id = meetingIdFor(locals, params.date);
		const fd = await request.formData();
		savePrayers(
			locals.db,
			id,
			[1, 2].map((position) => ({ position, memberId: optInt(fd, `prayer${position}_member`), status: statusOf(str(fd, `prayer${position}_status`)) }))
		);
		return { saved: 'prayers' };
	},
	talks: async ({ request, locals, params }) => {
		requireRole(locals.user, 'meeting.program');
		const id = meetingIdFor(locals, params.date);
		const fd = await request.formData();
		const start = str(fd, 'talksStartTime');
		if (start && !TIME.test(start)) return fail(400, { error: 'Startzeit bitte als HH:MM angeben.' });
		const talks: TalkInput[] = [];
		for (const position of [1, 2, 3, 4]) {
			if (!fd.has(`talk${position}_status`)) continue;
			const t: TalkInput = {
				position,
				memberId: optInt(fd, `talk${position}_member`),
				topic: optStr(fd, `talk${position}_topic`),
				durationMinutes: optInt(fd, `talk${position}_duration`),
				status: statusOf(str(fd, `talk${position}_status`)),
				note: optStr(fd, `talk${position}_note`)
			};
			if (t.memberId === null && t.topic === null && t.durationMinutes === null && t.note === null) continue;
			talks.push(t);
		}
		saveTalks(locals.db, id, talks, start || null);
		return { saved: 'talks' };
	},
	announcements: async ({ request, locals, params }) => {
		requireRole(locals.user, 'meeting.program');
		const id = meetingIdFor(locals, params.date);
		const fd = await request.formData();
		saveAnnouncements(locals.db, id, strList(fd, 'announcement'));
		return { saved: 'announcements' };
	},
	callings: async ({ request, locals, params }) => {
		requireRole(locals.user, 'meeting.program');
		const id = meetingIdFor(locals, params.date);
		const fd = await request.formData();
		const pairs = (kind: 'entlassung' | 'berufung', prefix: string) => {
			const names = fd.getAll(`${prefix}_name`).map((v) => String(v).trim());
			const callings = fd.getAll(`${prefix}_calling`).map((v) => String(v).trim());
			return names.map((personName, i) => ({ kind, personName, calling: callings[i] ?? '' })).filter((c) => c.personName || c.calling);
		};
		saveCallings(locals.db, id, [...pairs('entlassung', 'release'), ...pairs('berufung', 'sustain')]);
		return { saved: 'callings' };
	},
	music: async ({ request, locals, params }) => {
		requireRole(locals.user, 'meeting.music');
		const id = meetingIdFor(locals, params.date);
		const fd = await request.formData();
		const hymns = {} as Record<HymnSlot, { hymnNumber: number | null; freeText: string | null }>;
		for (const slot of HYMN_SLOTS) {
			const text = str(fd, `hymn_${slot}`);
			const hymnNumber = leadingInt(text);
			if (text && hymnNumber === null) return fail(400, { error: `${SLOT_LABELS[slot]}: bitte ein Lied aus der Liste wählen oder die Nummer eingeben.` });
			hymns[slot] = { hymnNumber, freeText: slot === 'zwischen' ? optStr(fd, 'zwischen_text') : null };
		}
		const result = saveMusic(locals.db, id, {
			hymns,
			organistMemberId: optInt(fd, 'organist'),
			conductorMemberId: optInt(fd, 'conductor'),
			musicNote: optStr(fd, 'musicNote')
		});
		if (result.unknownNumbers.length) {
			return fail(400, { error: `Lied Nr. ${result.unknownNumbers.join(', ')} gibt es noch nicht. Bitte zuerst unter "Lieder" anlegen. Die übrigen Angaben wurden gespeichert.` });
		}
		return { saved: 'music' };
	},
	conductor: async ({ request, locals, params }) => {
		requireRole(locals.user, 'meeting.conductor');
		const id = meetingIdFor(locals, params.date);
		const fd = await request.formData();
		saveConductor(locals.db, id, optInt(fd, 'conductor'));
		return { saved: 'conductor' };
	},
	quickAdd: async ({ request, locals }) => {
		requireRole(locals.user, 'members.create');
		const fd = await request.formData();
		const firstName = str(fd, 'firstName');
		if (!firstName) return fail(400, { error: 'Bitte mindestens einen Vornamen angeben.' });
		const m = createMember(locals.db, { firstName, lastName: str(fd, 'lastName'), affiliation: optStr(fd, 'affiliation') });
		return { saved: 'quickAdd', added: displayName(m) };
	}
};
