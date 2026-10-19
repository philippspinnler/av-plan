type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Snapshot = [Field, string, boolean][];

const isField = (el: EventTarget | null): el is Field =>
	((el instanceof HTMLInputElement && el.type !== 'hidden') || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) && !!el.form;

const take = (fields: Iterable<Field>): Snapshot => [...fields].map((el) => [el, el.value, el instanceof HTMLInputElement && el.checked]);

/**
 * Keeps the fields the user changed but has not saved yet across data reloads.
 * Needed because Svelte 5 hydration drops the cached `value` of SSR-rendered inputs, so the first
 * reload after page load writes the server value into every field, unchanged or not.
 * Untouched fields are left alone, so they still pick up other users' changes.
 */
export function trackUnsaved() {
	const changed = new Set<Field>();
	return {
		mark(el: EventTarget | null) {
			if (isField(el)) changed.add(el);
		},
		/** Marked fields of a form as they are sent; pass to `saved` once the save succeeded. */
		sending(formId: string): Snapshot {
			return take([...changed].filter((el) => el.form?.id === formId));
		},
		/** Unmarks the sent fields, unless they were changed again while the save was running. */
		saved(sent: Snapshot) {
			for (const [el, value, checked] of sent) {
				if (el.value === value && (!(el instanceof HTMLInputElement) || el.checked === checked)) changed.delete(el);
			}
		},
		snapshot(): Snapshot {
			for (const el of changed) if (!el.isConnected) changed.delete(el);
			return take(changed);
		},
		restore(snap: Snapshot) {
			for (const [el, value, checked] of snap) {
				el.value = value;
				if (el instanceof HTMLInputElement) el.checked = checked;
			}
		}
	};
}
