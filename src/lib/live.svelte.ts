import { invalidateAll } from '$app/navigation';

/** What the live channel knows about the others (see src/lib/server/live.ts). */
export type Presence = { client: string; userId: number; name: string; page: string; field: string | null };

export const live = $state({ others: [] as Presence[] });

/**
 * Connects the browser to the live channel: others' changes reload the page, and our own
 * position (page, focused field) is reported.
 */
export function connectLive(getPage: () => string): { disconnect: () => void; pageChanged: () => void } {
	const client = crypto.randomUUID();
	let field: string | null = null;
	let sendTimer: ReturnType<typeof setTimeout> | undefined;
	let reloadTimer: ReturnType<typeof setTimeout> | undefined;

	const send = () => {
		clearTimeout(sendTimer);
		sendTimer = setTimeout(() => {
			fetch('/presence', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client, page: getPage(), field }), keepalive: true }).catch(() => {});
		}, 150);
	};
	const onFocus = (e: FocusEvent) => {
		const el = e.target as HTMLElement | null;
		const next = el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.id ? el.id : null;
		if (next !== field) { field = next; send(); }
	};
	const onBlur = () => { if (field) { field = null; send(); } };

	const es = new EventSource(`/events?c=${client}`);
	es.onopen = send;
	es.onmessage = (m) => {
		const e = JSON.parse(m.data) as { kind: 'change'; page: string } | { kind: 'presence'; list: Presence[] };
		if (e.kind === 'presence') live.others = e.list.filter((p) => p.client !== client);
		else {
			clearTimeout(reloadTimer);
			reloadTimer = setTimeout(() => invalidateAll(), 200);
		}
	};
	document.addEventListener('focusin', onFocus);
	document.addEventListener('focusout', onBlur);
	const heartbeat = setInterval(send, 20_000);
	return {
		pageChanged: () => { field = null; send(); },
		disconnect: () => {
			es.close();
			clearInterval(heartbeat);
			clearTimeout(sendTimer);
			document.removeEventListener('focusin', onFocus);
			document.removeEventListener('focusout', onBlur);
		}
	};
}

