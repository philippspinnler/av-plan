import { beforeAll, describe, expect, it } from 'vitest';

class FakeInput {
	type = 'text';
	checked = false;
	isConnected = true;
	constructor(public value: string, public form: unknown) {}
}

function fakeForm(id: string, version: string) {
	const versionField = { value: version };
	return { id, versionField, elements: { namedItem: (n: string) => (n === 'version' ? versionField : null) } };
}

let trackUnsaved: typeof import('./unsaved-fields').trackUnsaved;
beforeAll(async () => {
	Object.assign(globalThis, { HTMLInputElement: FakeInput, HTMLSelectElement: class {}, HTMLTextAreaElement: class {} });
	({ trackUnsaved } = await import('./unsaved-fields'));
});

/** Simulates a data reload: the server writes its values, then the kept fields are restored. */
function reload(t: ReturnType<typeof trackUnsaved>, form: ReturnType<typeof fakeForm>, field: HTMLInputElement, server: { value: string; version: string }) {
	const kept = t.snapshot();
	field.value = server.value;
	form.versionField.value = server.version;
	t.restore(kept);
}

describe('trackUnsaved', () => {
	it('releases a field typed in and set back before blur', () => {
		const t = trackUnsaved();
		const form = fakeForm('f', 'v1');
		const field = new FakeInput('Alt', form) as unknown as HTMLInputElement;
		t.focus(field);
		field.value = 'Altx';
		t.mark(field);
		field.value = 'Alt';
		t.release(field, false);
		reload(t, form, field, { value: 'Neu', version: 'v2' });
		expect([field.value, form.versionField.value]).toEqual(['Neu', 'v2']);
	});

	it('keeps an unsaved field on its old version after another change', () => {
		const t = trackUnsaved();
		const form = fakeForm('f', 'v1');
		const field = new FakeInput('Alt', form) as unknown as HTMLInputElement;
		t.focus(field);
		field.value = 'Mein';
		t.mark(field);
		reload(t, form, field, { value: 'Fremd', version: 'v2' });
		expect([field.value, form.versionField.value]).toEqual(['Mein', 'v1']);
	});

	it('re-bases on the new version after an own save', () => {
		const t = trackUnsaved();
		const form = fakeForm('f', 'v1');
		const field = new FakeInput('Alt', form) as unknown as HTMLInputElement;
		field.value = 'Mein';
		t.mark(field);
		const sent = t.sending('f');
		field.value = 'Mein mehr';
		t.mark(field);
		t.saved(sent);
		reload(t, form, field, { value: 'Mein', version: 'v2' });
		expect([field.value, form.versionField.value]).toEqual(['Mein mehr', 'v2']);
	});

	it('takes the fresh version for a field marked between an own save and its reload', () => {
		const t = trackUnsaved();
		const form = fakeForm('f', 'v1');
		const details = new FakeInput('Alt', form) as unknown as HTMLInputElement;
		const snack = new FakeInput('', form) as unknown as HTMLInputElement;
		details.value = 'Neu';
		t.mark(details);
		const sent = t.sending('f');
		t.saved(sent);
		snack.value = 'Chi';
		t.mark(snack);
		reload(t, form, details, { value: 'Neu', version: 'v2' });
		expect([snack.value, form.versionField.value]).toEqual(['Chi', 'v2']);
	});
});
