<script lang="ts">
	import { enhance } from '$app/forms';
	import MemberSelect from '$lib/components/MemberSelect.svelte';
	import { trackUnsaved } from '$lib/unsaved-fields';
	let { data, form } = $props();

	type Side = 'jd' | 'jm' | 'both';
	type Option = { value: string; label: string };
	type Idea = { id: number; text: string; note: string | null };

	const ev = $derived(data.full.event);
	const kindLabel = $derived(data.kinds.find((k) => k.value === ev.kind)?.label ?? ev.kind);
	const part = (side: Side) => data.full.parts.find((p) => p.side === side);
	const canBoth = $derived(data.canJd || data.canJm);
	const sections = $derived.by(() => {
		if (ev.joint) {
			const groups = [...data.groupsJd, ...data.groupsJm].filter((g, i, all) => all.findIndex((x) => x.value === g.value) === i);
			return [{ side: 'both' as Side, title: 'Gemeinsam', canEdit: canBoth, version: data.versions.both, options: [...data.jdOptions, ...data.jmOptions], groups, ideas: data.ideasBoth }];
		}
		return [
			{ side: 'jd' as Side, title: 'JD', canEdit: data.canJd, version: data.versions.jd, options: data.jdOptions, groups: data.groupsJd, ideas: data.ideasJd },
			{ side: 'jm' as Side, title: 'JM', canEdit: data.canJm, version: data.versions.jm, options: data.jmOptions, groups: data.groupsJm, ideas: data.ideasJm }
		];
	});
	const presentLabel = (p: boolean | null) => (p === true ? 'anwesend' : p === false ? 'abwesend' : '–');

	/** Idea taken over per side; the side action plans it together with the saved text. */
	let takenIdea = $state<Record<string, number | null>>({});

	let results = $state<Record<string, { ok: boolean; error?: string }>>({});
	let pending = $state(0);

	/**
	 * Autosave, same as the Sunday page: changes mark their form as unsaved and the marked
	 * forms are submitted one after another, never concurrently, so no stale version is sent.
	 */
	let queue: string[] = [];
	const dirty = new Set<string>();
	let unsaved = $state(false);
	let conflict = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
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
		// A queued form can be gone after "gemeinsam" was toggled.
		while ((id = queue.shift())) {
			const f = document.getElementById(id) as HTMLFormElement | null;
			if (f) return f.requestSubmit();
		}
		flush();
	}
	/** A form responded: keep the result, reload data, then the next form. */
	function saved(key: string) {
		pending++;
		const sent = changedFields.sending(`${key}Form`);
		return async ({ result, update }: { result: { type: string; status?: number; data?: Record<string, unknown>; error?: { message?: string } }; update: (o: { reset: boolean }) => Promise<void> }) => {
			pending--;
			if (result.type === 'success') {
				results[key] = { ok: true };
				takenIdea[key] = null;
				changedFields.saved(sent);
			}
			else if (result.type === 'failure') results[key] = { ok: false, error: String(result.data?.error ?? 'Fehler') };
			else results[key] = { ok: false, error: result.error?.message ?? 'Fehler' };
			if (result.status === 409) conflict = true;
			await update({ reset: false });
			submitNext();
		};
	}
	function takeIdea(side: Side, idea: Idea) {
		const field = document.getElementById(`${side}_text`) as HTMLInputElement | null;
		if (!field || conflict) return;
		field.value = idea.text;
		changedFields.mark(field);
		takenIdea[side] = idea.id;
		touch(`${side}Form`);
	}
	const changedFields = trackUnsaved();
	let kept: ReturnType<typeof changedFields.snapshot> = [];
	$effect.pre(() => {
		void data;
		kept = changedFields.snapshot();
	});
	$effect(() => {
		void data;
		changedFields.restore(kept);
	});
	/** Field changes land here (fields attach to their form via form="…"). */
	function onFieldChange(e: Event) {
		changedFields.mark(e.target);
		const formId = (e.target as HTMLInputElement | null)?.form?.id;
		if (formId) touch(formId);
	}
	/** Enter in a text field saves instead of submitting the form unthrottled. */
	function onFieldKey(e: KeyboardEvent) {
		const el = e.target as HTMLInputElement | null;
		if (e.key === 'Enter' && el?.tagName === 'INPUT' && el.form) {
			e.preventDefault();
			touch(el.form.id);
		}
	}

	const saveStatus = $derived.by(() => {
		const entries = Object.values(results);
		const errors = entries.filter((r) => !r.ok).map((r) => r.error ?? 'Fehler');
		if (errors.length) return { kind: 'error' as const, text: errors.join(' · ') };
		if (pending > 0 || unsaved) return { kind: 'hint' as const, text: 'Speichern …' };
		if (entries.length && entries.every((r) => r.ok)) return { kind: 'ok' as const, text: 'Gespeichert' };
		return { kind: 'hint' as const, text: 'Änderungen werden automatisch gespeichert' };
	});
</script>

{#snippet partSection(s: { side: Side; title: string; canEdit: boolean; options: { id: number; label: string; hint: string }[]; groups: Option[]; ideas: Idea[] })}
	{@const p = part(s.side)}
	{@const formId = `${s.side}Form`}
	<div class="section">
		<h2>{s.title}</h2>
		{#if !data.isSunday}
			<div class="grid-2">
				<div class="field">
					<label for="{s.side}_text">Aktivität</label>
					{#if s.canEdit}
						<input id="{s.side}_text" name="text" type="text" form={formId} value={p?.text ?? ''} />
					{:else}
						<p>{p?.text ?? '–'}</p>
					{/if}
				</div>
				{#if s.canEdit && s.ideas.length}
					<div class="field">
						<span class="label">Ideen</span>
						<ul class="row-list">
							{#each s.ideas as i (i.id)}
								<li>
									<span title={i.note ? `${i.text} – ${i.note}` : i.text}>{i.text}</span>
									<button class="btn btn-small" type="button" title={i.note ? `${i.text} – ${i.note}` : i.text} onclick={() => takeIdea(s.side, i)}>übernehmen</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}
		<div class="grid-2">
			<div class="field">
				<label for="{s.side}_leader">Leitung</label>
				{#if !s.canEdit}
					<p>{data.isSunday ? (s.groups.find((g) => g.value === p?.leaderGroup)?.label ?? '–') : (p?.leaderName ?? '–')}</p>
				{:else if data.isSunday}
					<select id="{s.side}_leader" name="leaderGroup" form={formId}>
						<option value="" selected={!p?.leaderGroup}>–</option>
						{#each s.groups as g}<option value={g.value} selected={g.value === p?.leaderGroup}>{g.label}</option>{/each}
					</select>
				{:else}
					<MemberSelect id="{s.side}_leader" name="leader" form={formId} options={s.options} value={p?.leaderId ?? null} />
				{/if}
			</div>
			<div class="field">
				<label for="{s.side}_thought">Gedanke</label>
				{#if s.canEdit}
					<MemberSelect id="{s.side}_thought" name="thought" form={formId} options={s.options} value={p?.thoughtId ?? null} />
				{:else}
					<p>{p?.thoughtName ?? '–'}</p>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<p class="no-print"><a href="/jugend">← Termine</a></p>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="has-savebar" onchange={onFieldChange} oninput={(e) => changedFields.mark(e.target)} onfocusin={(e) => changedFields.focus(e.target)} onfocusout={(e) => changedFields.release(e.target, pending > 0 || dirty.size > 0)} onkeydown={onFieldKey}>
	<div class="section-title">
		<div>
			<span class="kind-tag">{kindLabel}</span>
			<h2>{data.dateLabel}</h2>
		</div>
	</div>
	{#if form?.error}<div class="error">{form.error}</div>{/if}
	{#if data.offNotice}<p class="hint">{data.isSunday ? 'Keine Klasse' : 'Kein JD/JM'}: {data.offNotice}</p>{/if}
	{#if data.breakHint}<p class="hint">Liegt in: {data.breakHint}</p>{/if}

	{#if data.canCommon}
		<form id="commonForm" method="POST" action="?/common" use:enhance={() => saved('common')}><input type="hidden" name="version" value={data.versions.common} /></form>
		<form id="adultsForm" method="POST" action="?/adults" use:enhance={() => saved('adults')}><input type="hidden" name="version" value={data.versions.adults} /></form>
	{/if}
	{#each sections as s (s.side)}
		{#if s.canEdit}
			<form id="{s.side}Form" method="POST" action="?/{s.side}" use:enhance={() => saved(s.side)}><input type="hidden" name="version" value={s.version} /><input type="hidden" name="ideaId" value={takenIdea[s.side] ?? ''} /></form>
		{/if}
	{/each}

	<div class="section">
		<h2>Allgemein</h2>
		<div class="grid-2">
			<div class="field">
				<label for="kind">Art</label>
				{#if data.canCommon}
					<select id="kind" name="kind" form="commonForm">{#each data.kinds as k}<option value={k.value} selected={k.value === ev.kind}>{k.label}</option>{/each}</select>
				{:else}
					<p>{kindLabel}</p>
				{/if}
			</div>
			<div class="field">
				<span class="label">JD und JM</span>
				{#if data.canCommon}
					<label class="check"><input type="checkbox" name="joint" value="1" form="commonForm" checked={ev.joint} /> gemeinsam</label>
				{:else}
					<p>{ev.joint ? 'gemeinsam' : 'getrennt'}</p>
				{/if}
			</div>
		</div>
		<div class="field">
			<label for="details">Details</label>
			{#if data.canCommon}
				<input id="details" name="details" type="text" form="commonForm" value={ev.details ?? ''} />
			{:else}
				<p>{ev.details ?? '–'}</p>
			{/if}
		</div>
		{#if data.isSunday}
			<div class="grid-2">
				<div class="field">
					<label for="topic">Thema</label>
					{#if data.canCommon}
						<input id="topic" name="topic" type="text" form="commonForm" value={ev.topic ?? ''} />
					{:else}
						<p>{ev.topic ?? '–'}</p>
					{/if}
				</div>
				<div class="field">
					<label for="topicUrl">Link</label>
					{#if data.canCommon}
						<input id="topicUrl" name="topicUrl" type="text" inputmode="url" form="commonForm" value={ev.topicUrl ?? ''} placeholder="https://" />
					{:else if ev.topicUrl}
						<p><a href={ev.topicUrl} target="_blank" rel="noopener noreferrer">{ev.topicUrl}</a></p>
					{:else}
						<p>–</p>
					{/if}
				</div>
			</div>
		{:else}
			<div class="field">
				<label for="snack">Snack</label>
				{#if data.canCommon}
					<input id="snack" name="snack" type="text" form="commonForm" value={ev.snack ?? ''} />
				{:else}
					<p>{ev.snack ?? '–'}</p>
				{/if}
			</div>
		{/if}
	</div>

	{#if !data.off}
		{#each sections as s (s.side)}{@render partSection(s)}{/each}

		<div class="section">
			<h2>Erwachsene</h2>
			{#if !data.adults.length}
				<p class="hint">Noch keine Bischofschaft oder Jugendleitung erfasst.</p>
			{/if}
			{#each data.adults as a (a.id)}
				<div class="field">
					<span class="label">{a.name}</span>
					{#if data.canCommon}
						<div class="check-list">
							<label class="check"><input type="radio" name="adult_{a.id}" value="1" form="adultsForm" checked={a.present === true} /> anwesend</label>
							<label class="check"><input type="radio" name="adult_{a.id}" value="0" form="adultsForm" checked={a.present === false} /> abwesend</label>
							<label class="check"><input type="radio" name="adult_{a.id}" value="" form="adultsForm" checked={a.present === null} /> –</label>
						</div>
					{:else}
						<p>{presentLabel(a.present)}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<div class="savebar no-print">
	<span class="savebar-status" class:err={saveStatus.kind === 'error'}>{saveStatus.text}</span>
	{#if conflict}<button class="btn btn-primary" type="button" onclick={() => location.reload()}>Seite neu laden</button>{/if}
</div>
