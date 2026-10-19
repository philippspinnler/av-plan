import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { todayIso } from '$lib/dates';
import { int, str } from '$lib/server/forms';
import { requireRole } from '$lib/server/permissions';
import { getAllSettings, setSetting } from '$lib/server/settings';
import { newYouthPageToken } from '$lib/server/youth-page';
import { ensureSundays } from '$lib/server/meetings';
import { createStakeCalling, deleteStakeCalling, listStakeCallings, moveStakeCalling, renameStakeCalling, setStakeCallingPresides } from '$lib/server/stake-callings';

export const load: PageServerLoad = ({ locals }) => {
	requireRole(locals.user, 'settings.edit');
	return {
		settings: getAllSettings(locals.db),
		callings: listStakeCallings(locals.db).map((c) => ({ id: c.id, name: c.name, presides: c.presides }))
	};
};

export const actions: Actions = {
	general: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		const ward = str(fd, 'ward_name');
		if (!ward) return fail(400, { error: 'Der Gemeindename darf nicht leer sein.' });
		setSetting(locals.db, 'ward_name', ward);
		return { saved: true };
	},
	youthToken: ({ locals }) => {
		requireRole(locals.user, 'settings.edit');
		setSetting(locals.db, 'youth_page_token', newYouthPageToken());
		return { saved: true };
	},
	presidesCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		setStakeCallingPresides(locals.db, int(fd, 'id'), fd.get('presides') === '1');
		return { saved: true };
	},
	addCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		try {
			createStakeCalling(locals.db, str(fd, 'name'));
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
		return { saved: true };
	},
	renameCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		try {
			renameStakeCalling(locals.db, int(fd, 'id'), str(fd, 'name'));
		} catch (e) {
			return fail(400, { error: (e as Error).message });
		}
		return { saved: true };
	},
	deleteCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		if (!deleteStakeCalling(locals.db, int(fd, 'id'))) return fail(400, { error: 'Diese Berufung wird noch bei Pfahlbeamten verwendet.' });
		return { saved: true };
	},
	moveCalling: async ({ request, locals }) => {
		requireRole(locals.user, 'settings.edit');
		const fd = await request.formData();
		moveStakeCalling(locals.db, int(fd, 'id'), str(fd, 'dir') === 'up' ? -1 : 1);
		return { saved: true };
	},
	ensureSundays: ({ locals }) => {
		requireRole(locals.user, 'settings.edit');
		const created = ensureSundays(locals.db, todayIso(), 12);
		return { created };
	}

};
