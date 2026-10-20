import { invalidateAll } from '$app/navigation';
import { trackUnsaved } from '$lib/unsaved-fields';

type Result = { type: string; status?: number; data?: Record<string, unknown>; error?: { message?: string } };

/**
 * Autosave: each change marks its form as unsaved; shortly after, the marked forms are
 * submitted one after another, never concurrently. With parallel requests one form's data
 * reload could run before the other's write and overwrite freshly typed values with stale
 * data. If a save is running, the next round waits for it (else it would carry a stale version).
 * Call during component init; `deps` is read so unsaved fields survive each data reload.
 */
export function createAutosave(opts: { deps: () => unknown; onSaved?: (key: string) => void }) {
	let results = $state<Record<string, { ok: boolean; error?: string }>>({});
	let pending = $state(0);
	let unsaved = $state(false);
	let conflict = $state(false);
	let queue: string[] = [];
	const dirty = new Set<string>();
	let timer: ReturnType<typeof setTimeout> | undefined;
	const changedFields = trackUnsaved();

	function touch(formId: string) {
		if (conflict) return;
		dirty.add(formId);
		unsaved = true;
		clearTimeout(timer);
		timer = setTimeout(flush, 400);
	}
	function flush() {
		if (pending > 0 || dirty.size === 0) return;
		queue = [...dirty];
		dirty.clear();
		unsaved = false;
		results = {};
		submitNext();
	}
	function submitNext() {
		let id;
		// A queued form can be gone meanwhile, e.g. after "gemeinsam" was toggled.
		while ((id = queue.shift())) {
			const f = document.getElementById(id) as HTMLFormElement | null;
			if (f) return f.requestSubmit();
		}
		flush();
	}
	/** `use:enhance` callback: keep the result, reload data, then the next form. */
	function saved(key: string) {
		pending++;
		const sent = changedFields.sending(`${key}Form`);
		return async ({ result, update }: { result: Result; update: (o: { reset: boolean }) => Promise<void> }) => {
			pending--;
			if (result.type === 'success') {
				results[key] = { ok: true };
				changedFields.saved(sent);
				opts.onSaved?.(key);
			} else if (result.type === 'failure') results[key] = { ok: false, error: String(result.data?.error ?? 'Fehler') };
			else results[key] = { ok: false, error: result.error?.message ?? 'Fehler' };
			if (result.status === 409) conflict = true;
			// update() would also run applyAction, whose focus reset blurs the field the user is typing in.
			if (result.type === 'success') await invalidateAll();
			else await update({ reset: false });
			submitNext();
		};
	}

	let kept: ReturnType<typeof changedFields.snapshot> = [];
	$effect.pre(() => {
		opts.deps();
		kept = changedFields.snapshot();
	});
	$effect(() => {
		opts.deps();
		changedFields.restore(kept);
	});

	/** Spread on the element wrapping the fields (fields attach to their form via form="…"). */
	const handlers = {
		onchange(e: Event) {
			changedFields.mark(e.target);
			const formId = (e.target as HTMLInputElement | null)?.form?.id;
			if (formId) touch(formId);
		},
		oninput: (e: Event) => changedFields.mark(e.target),
		onfocusin: (e: FocusEvent) => changedFields.focus(e.target),
		onfocusout: (e: FocusEvent) => changedFields.release(e.target, pending > 0 || dirty.size > 0),
		/** Enter in a text field saves instead of submitting the form unthrottled. */
		onkeydown(e: KeyboardEvent) {
			const el = e.target as HTMLInputElement | null;
			if (e.key === 'Enter' && el?.tagName === 'INPUT' && el.form) {
				e.preventDefault();
				touch(el.form.id);
			}
		}
	};

	const status = $derived.by(() => {
		const entries = Object.values(results);
		const errors = entries.filter((r) => !r.ok).map((r) => r.error ?? 'Fehler');
		if (errors.length) return { kind: 'error' as const, text: errors.join(' · ') };
		if (pending > 0 || unsaved) return { kind: 'hint' as const, text: 'Speichern …' };
		if (entries.length && entries.every((r) => r.ok)) return { kind: 'ok' as const, text: 'Gespeichert' };
		return { kind: 'hint' as const, text: 'Änderungen werden automatisch gespeichert' };
	});

	return {
		touch,
		saved,
		mark: changedFields.mark,
		handlers,
		get status() {
			return status;
		},
		get conflict() {
			return conflict;
		}
	};
}
