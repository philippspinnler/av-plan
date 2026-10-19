/**
 * Live channel for all open browsers: who is where, and that something changed.
 * In-memory in this one process only.
 * ponytail: one process, one container; multiple instances would need Redis or similar in between.
 */
export type Presence = { client: string; userId: number; name: string; page: string; field: string | null; seen: number };
export type LiveEvent = { kind: 'change'; page: string } | { kind: 'presence'; list: Presence[] };

const STALE_MS = 60_000;

export function createLive(now: () => number = Date.now) {
	const subscribers = new Set<(e: LiveEvent) => void>();
	const presence = new Map<string, Presence>();
	const publish = (e: LiveEvent) => subscribers.forEach((fn) => fn(e));
	const list = () => {
		const cutoff = now() - STALE_MS;
		for (const [k, p] of presence) if (p.seen < cutoff) presence.delete(k);
		return [...presence.values()];
	};
	return {
		subscribe(fn: (e: LiveEvent) => void): () => void {
			subscribers.add(fn);
			return () => subscribers.delete(fn);
		},
		changed(page: string) {
			publish({ kind: 'change', page });
		},
		list,
		setPresence(client: string, user: { userId: number; name: string }, page: string, field: string | null) {
			presence.set(client, { client, ...user, page, field, seen: now() });
			publish({ kind: 'presence', list: list() });
		},
		removePresence(client: string) {
			if (presence.delete(client)) publish({ kind: 'presence', list: list() });
		}
	};
}

export const live = createLive();
