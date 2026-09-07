import { error } from '@sveltejs/kit';
import type { Role } from './db/schema';

export type Action =
	| 'meeting.program'
	| 'meeting.music'
	| 'meetings.create'
	| 'hymns.edit'
	| 'members.create'
	| 'members.edit'
	| 'members.stats'
	| 'users.manage'
	| 'settings.edit';

const MATRIX: Record<Action, Role[]> = {
	'meeting.program': ['admin', 'bischofschaft'],
	'meeting.music': ['admin', 'musik'],
	'meetings.create': ['admin', 'bischofschaft'],
	'hymns.edit': ['admin', 'musik'],
	'members.create': ['admin', 'bischofschaft'],
	'members.edit': ['admin'],
	'members.stats': ['admin', 'bischofschaft'],
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
	return { admin: 'Admin', bischofschaft: 'Bischofschaft', musik: 'Musik' }[role];
}
