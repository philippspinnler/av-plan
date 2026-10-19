type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Snapshot = [Field, string, boolean][];

const isField = (el: EventTarget | null): el is Field =>
	((el instanceof HTMLInputElement && el.type !== 'hidden') || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) && !!el.form;

const take = (fields: Iterable<Field>): Snapshot => [...fields].map((el) => [el, el.value, el instanceof HTMLInputElement && el.checked]);

const versionInput = (form: HTMLFormElement | null) => form?.elements.namedItem('version') as HTMLInputElement | null;

/**
 * Keeps the fields the user changed but has not saved yet across data reloads.
 * Needed because Svelte 5 hydration drops the cached `value` of SSR-rendered inputs, so the first
 * reload after page load writes the server value into every field, unchanged or not.
 * Untouched fields are left alone, so they still pick up other users' changes.
 * A kept field is saved against the version it was edited on: if the section changed meanwhile,
 * `restore` puts that old version back so the save fails with a conflict instead of reverting the other change.
 */
export function trackUnsaved() {
	const changed = new Set<Field>();
	/** Version of each form when its first unsaved field was marked. */
	const baseVersion = new Map<string, string>();
	let focused: { el: Field; value: string; wasMarked: boolean } | null = null;

	const remember = (el: Field) => {
		const v = versionInput(el.form);
		if (el.form && v && !baseVersion.has(el.form.id)) baseVersion.set(el.form.id, v.value);
	};
	return {
		mark(el: EventTarget | null) {
			if (!isField(el)) return;
			remember(el);
			changed.add(el);
		},
		/** Call on focusin, so `release` can tell a typed-then-undone field from a real change. */
		focus(el: EventTarget | null) {
			if (isField(el)) focused = { el, value: el.value, wasMarked: changed.has(el) };
		},
		/**
		 * Call on focusout: a field typed in and set back to its value at focus gets no change event,
		 * so it is unmarked here. `busy` (a save queued or running) keeps it, the save unmarks it.
		 */
		release(el: EventTarget | null, busy: boolean) {
			const f = focused;
			focused = null;
			if (f?.el === el && !f.wasMarked && !busy && f.el.value === f.value) changed.delete(f.el);
		},
		/** Marked fields of a form as they are sent; pass to `saved` once the save succeeded. */
		sending(formId: string): { formId: string; fields: Snapshot } {
			return { formId, fields: take([...changed].filter((el) => el.form?.id === formId)) };
		},
		/** Unmarks the sent fields, unless they were changed again while the save was running. */
		saved(sent: { formId: string; fields: Snapshot }) {
			for (const [el, value, checked] of sent.fields) {
				if (el.value === value && (!(el instanceof HTMLInputElement) || el.checked === checked)) changed.delete(el);
			}
			// ponytail: fields still marked are re-based on the version after this save's reload; a third save landing in between goes unnoticed.
			baseVersion.delete(sent.formId);
		},
		snapshot(): Snapshot {
			for (const el of changed) if (!el.isConnected) changed.delete(el);
			for (const id of baseVersion.keys()) if (![...changed].some((el) => el.form?.id === id)) baseVersion.delete(id);
			return take(changed);
		},
		restore(snap: Snapshot) {
			for (const [el, value, checked] of snap) {
				el.value = value;
				if (el instanceof HTMLInputElement) el.checked = checked;
				remember(el);
				const v = versionInput(el.form);
				if (v && el.form) v.value = baseVersion.get(el.form.id)!;
			}
		}
	};
}
