import { error } from '@sveltejs/kit';
import type { Role } from './db/schema';

export type Action =
	| 'program.view'
	| 'meeting.program'
	| 'meeting.prayers'
	| 'meeting.music'
	| 'meeting.conductor'
	| 'meetings.create'
	| 'hymns.view'
	| 'hymns.edit'
	| 'members.create'
	| 'members.edit'
	| 'members.stats'
	| 'ask.talks'
	| 'ask.prayers'
	| 'users.manage'
	| 'settings.edit';

const MATRIX: Record<Action, Role[]> = {
	'program.view': ['admin', 'bischofschaft'],
	'meeting.program': ['admin', 'bischofschaft'],
	'meeting.prayers': ['admin', 'bischofschaft', 'gebete'],
	'meeting.music': ['admin', 'bischofschaft', 'musik'],
	'meeting.conductor': ['admin', 'bischofschaft', 'musik', 'dirigent'],
	'meetings.create': ['admin', 'bischofschaft'],
	'hymns.view': ['admin', 'bischofschaft', 'musik', 'dirigent'],
	'hymns.edit': ['admin', 'bischofschaft', 'musik'],
	'members.create': ['admin'],
	'members.edit': ['admin'],
	'members.stats': ['admin', 'bischofschaft'],
	'ask.talks': ['admin', 'bischofschaft'],
	'ask.prayers': ['admin', 'bischofschaft', 'gebete'],
	'users.manage': ['admin'],
	'settings.edit': ['admin']
};

export function can(role: Role, action: Action): boolean {
	return MATRIX[action].includes(role);
}

export function requireRole(user: { role: Role } | null | undefined, action: Action): void {
	if (!user) error(401, 'Bitte anmelden');
	if (!can(user.role, action)) error(403, 'Dafür fehlt dir die Berechtigung');
}

export function roleLabel(role: Role): string {
	return { admin: 'Admin', bischofschaft: 'Bischofschaft', gebete: 'Gebete', musik: 'Musik', dirigent: 'Dirigent/in' }[role];
}
