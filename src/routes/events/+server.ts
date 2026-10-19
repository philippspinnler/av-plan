import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { live, type LiveEvent } from '$lib/server/live';

/** Server-Sent Events: every open browser subscribes here for changes and presence. */
export const GET: RequestHandler = ({ locals, url, request }) => {
	if (!locals.user) error(401, 'Bitte anmelden');
	const client = url.searchParams.get('c') ?? '';
	const enc = new TextEncoder();
	let cleanup = () => {};
	const stream = new ReadableStream({
		start(controller) {
			let open = true;
			const send = (e: LiveEvent | string) => {
				if (!open) return;
				try {
					controller.enqueue(enc.encode(typeof e === 'string' ? e : `data: ${JSON.stringify(e)}\n\n`));
				} catch {
					open = false;
				}
			};
			send({ kind: 'presence', list: live.list() });
			const unsubscribe = live.subscribe(send);
			// Keep-alive so proxies (cloudflared) don't drop the connection for silence.
			const ping = setInterval(() => send(': ping\n\n'), 25_000);
			cleanup = () => {
				if (!open) return;
				open = false;
				clearInterval(ping);
				unsubscribe();
				live.removePresence(client);
				try { controller.close(); } catch { /* already closed */ }
			};
			request.signal.addEventListener('abort', cleanup);
		},
		cancel() {
			cleanup();
		}
	});
	return new Response(stream, {
		headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' }
	});
};
