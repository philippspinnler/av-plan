import { ROLES, type Role } from './db/schema';

export const ROLE_VIEW_COOKIE = 'role_view';

function isRole(value: string): value is Role {
	return (ROLES as readonly string[]).includes(value);
}

export function effectiveRole(accountRole: Role, cookieValue: string | undefined): Role {
	if (accountRole === 'admin' && cookieValue !== undefined && isRole(cookieValue)) return cookieValue;
	return accountRole;
}
