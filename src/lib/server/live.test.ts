import { describe, expect, it } from 'vitest';
import { createLive } from './live';

describe('live', () => {
	it('broadcasts changes to all subscribers', () => {
		const live = createLive();
		const got: unknown[] = [];
		const off = live.subscribe((e) => got.push(e));
		live.changed('/sonntag/2026-09-13');
		off();
		live.changed('/fragen');
		expect(got).toEqual([{ kind: 'change', page: '/sonntag/2026-09-13' }]);
	});
	it('tracks who is where, and forgets those who left or went silent', () => {
		const live = createLive(() => 1000);
		const got: unknown[] = [];
		live.subscribe((e) => got.push(e));
		live.setPresence('c1', { userId: 1, name: 'Urs' }, '/sonntag/2026-09-13', 'theme');
		live.setPresence('c2', { userId: 2, name: 'Lea' }, '/sonntag/2026-09-13', null);
		expect(live.list().map((p) => [p.client, p.name, p.field])).toEqual([['c1', 'Urs', 'theme'], ['c2', 'Lea', null]]);
		expect(got.at(-1)).toEqual({ kind: 'presence', list: live.list() });
		live.removePresence('c2');
		expect(live.list().map((p) => p.client)).toEqual(['c1']);
		const later = createLive(() => 1000 + 61_000);
		later.setPresence('c3', { userId: 3, name: 'Mia' }, '/', null);
		expect(later.list().map((p) => p.client)).toEqual(['c3']);
	});
	it('forgets entries without a heartbeat', () => {
		let t = 0;
		const live = createLive(() => t);
		live.setPresence('c1', { userId: 1, name: 'Urs' }, '/', null);
		t = 61_000;
		live.setPresence('c2', { userId: 2, name: 'Lea' }, '/', null);
		expect(live.list().map((p) => p.client)).toEqual(['c2']);
	});
});
