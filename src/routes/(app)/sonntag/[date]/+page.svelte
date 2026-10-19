<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import HymnSelect from '$lib/components/HymnSelect.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MemberSelect from '$lib/components/MemberSelect.svelte';
	import { trackUnsaved } from '$lib/unsaved-fields';
	let { data, form } = $props();
	/** Cleared by a later successful save, which skips `applyAction` (see `saved`). */
	let formError = $derived(form?.error);

	let announcements = $state<string[]>([]);
	type CallingRow = { person: string; personName: string; calling: string };
	let releases = $state<CallingRow[]>([]);
	let sustainings = $state<CallingRow[]>([]);
	const toRow = (c: { personName: string; calling: string; memberId: number | null }): CallingRow => ({
		person: c.memberId ? String(c.memberId) : c.personName ? `name:${c.personName}` : '',
		personName: c.personName,
		calling: c.calling
	});
	const isFast = $derived(!data.missing && data.fastLike);
	/** Role "Gebete" sees only the prayers; header and sacrament are omitted for it. */
	const prayersOnly = $derived(!data.missing && !data.showProgram && !data.showHymns && data.canPrayers);
	type TabKey = 'allgemein' | 'begruessung' | 'aenderungen' | 'musik' | 'gebete' | 'ansprachen';
	/** Tabs by role and Sunday type. All fields stay mounted; only the selected tab is visible. */
	const tabs = $derived.by((): { key: TabKey; label: string; open: string[] }[] => {
		if (data.missing) return [];
		const t: { key: TabKey; label: string; open: string[] }[] = [];
		if (!prayersOnly) t.push({ key: 'allgemein', label: 'Allgemein', open: data.open.allgemein });
		if (data.hasProgram) {
			if (data.showProgram) t.push({ key: 'begruessung', label: 'Begrüssung und Bekanntmachungen', open: [] }, { key: 'aenderungen', label: 'Beamtenänderungen', open: [] });
			if (data.showHymns) t.push({ key: 'musik', label: 'Musik', open: data.open.musik });
			if (data.showProgram || data.canPrayers) t.push({ key: 'gebete', label: 'Gebete', open: data.open.gebete });
			if (data.showProgram && !isFast) t.push({ key: 'ansprachen', label: 'Ansprachen', open: data.open.ansprachen });
		}
		return t;
	});
	let requested = $state<string | null>(page.url.searchParams.get('tab'));
	const active = $derived(tabs.find((t) => t.key === requested)?.key ?? tabs[0]?.key ?? 'allgemein');
	function selectTab(key: TabKey) {
		requested = key;
		const url = new URL(page.url);
		url.searchParams.set('tab', key);
		replaceState(url, page.state);
	}
	const chairAutoLabel = $derived(data.missing ? '' : `automatisch${data.chairAutoName ? `: ${data.chairAutoName}` : ' (niemand bestimmt)'}`);
	/** Prayers belong to the program form; role "Gebete" has its own small form. */
	const prayerForm = $derived(data.showProgram ? 'programForm' : 'prayersForm');
	// svelte-ignore state_referenced_locally -- initial value only; re-synced by the date-keyed effect below
	let showFourth = $state(data.missing ? false : data.showFourth);
	let seededAnnouncements = $state<string | null>(null);
	let seededCallings = $state<string | null>(null);
	let seededFourth = $state<string | null>(null);
	let results = $state<Record<string, { ok: boolean; error?: string }>>({});
	let pending = $state(0);

	$effect(() => {
		if (data.missing) return;
		const a = JSON.stringify([data.date, data.announcements]);
		if (a !== untrack(() => seededAnnouncements)) {
			announcements = data.announcements.length ? [...data.announcements] : [''];
			seededAnnouncements = a;
		}
		const c = JSON.stringify([data.date, data.releases, data.sustainings]);
		if (c !== untrack(() => seededCallings)) {
			releases = data.releases.map(toRow);
			sustainings = data.sustainings.map(toRow);
			seededCallings = c;
		}
	});

	$effect(() => {
		if (data.missing) return;
		if (data.date !== untrack(() => seededFourth)) {
			showFourth = data.showFourth;
			seededFourth = data.date;
		}
	});

	function move<T>(arr: T[], i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= arr.length) return;
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}

	function findHymn(slot: string) {
		return data.missing ? undefined : data.hymns.find((h) => h.slot === slot);
	}

	function findTalk(position: number) {
		return data.missing ? undefined : data.talks.find((t) => t.position === position);
	}

	/**
	 * Autosave: each change marks its form as unsaved; shortly after, the marked forms are
	 * submitted one after another, never concurrently. With parallel requests one form's data
	 * reload could run before the other's write and overwrite freshly typed values with stale
	 * data. If a save is running, the next round waits for it (else it would carry a stale version).
	 */
	let queue: string[] = [];
	const dirty = new Set<string>();
	let unsaved = $state(false);
	let conflict = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	function touch(formId: string) {
		if (data.missing || conflict) return;
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
		const id = queue.shift();
		if (id) (document.getElementById(id) as HTMLFormElement | null)?.requestSubmit();
		else flush();
	}
	/** A form responded: keep the result, reload data, then the next form. */
	function saved(key: string) {
		pending++;
		const sent = changedFields.sending(`${key}Form`);
		return async ({ result, update }: { result: { type: string; status?: number; data?: Record<string, unknown>; error?: { message?: string } }; update: (o: { reset: boolean }) => Promise<void> }) => {
			pending--;
			if (result.type === 'success') {
				results[key] = { ok: true };
				changedFields.saved(sent);
				formError = undefined;
			}
			else if (result.type === 'failure') results[key] = { ok: false, error: String(result.data?.error ?? 'Fehler') };
			else results[key] = { ok: false, error: result.error?.message ?? 'Fehler' };
			if (result.status === 409) conflict = true;
			// update() would also run applyAction, whose focus reset blurs the field the user is typing in.
			if (result.type === 'success') await invalidateAll();
			else await update({ reset: false });
			submitNext();
		};
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

{#snippet hymnRow(h: { slot: string; label: string; value: string; freeText: string | null } | undefined)}
	{#if h}
		<div class="field">
			<label for="hymn_{h.slot}">{h.label}</label>
			{#if data.canMusic}
				<HymnSelect id="hymn_{h.slot}" name="hymn_{h.slot}" form="musicForm" options={data.missing ? [] : data.hymnList} value={h.value} />
				{#if h.slot === 'zwischen'}
					<input type="text" name="zwischen_text" form="musicForm" value={h.freeText ?? ''} placeholder="oder Musikeinlage, z.B. PV singt" />
				{/if}
			{:else}
				<p>{h.value || h.freeText || '–'}</p>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet personSelect(name: string, row: CallingRow, id: string)}
	<!-- Legacy data without a member link ("name:…") shows as an entry with id 0 and is sent back unchanged. -->
	{@const legacy = row.person.startsWith('name:')}
	{@const options = [...(legacy ? [{ id: 0, label: `${row.personName} (Freitext)`, hint: '' }] : []), ...(data.missing ? [] : data.callingOptions)]}
	<MemberSelect
		{id}
		{name}
		form="programForm"
		{options}
		value={legacy ? 0 : row.person ? Number(row.person) : null}
		placeholder="Mitglied wählen …"
		serialize={(v) => (v === 0 ? row.person : v === null ? '' : String(v))}
	/>
{/snippet}

{#snippet talkCard(t: { position: number; memberId: number | null; topic: string | null; durationMinutes: number | null; status: string; note: string | null; options: { id: number; label: string; hint: string }[] } | undefined, statuses: { value: string; label: string }[])}
	{#if t}
		<div class="card">
			<strong>Ansprache {t.position}</strong>
			<div class="grid-2">
				<div class="field"><label for="talk{t.position}_member">Sprecher</label><MemberSelect id="talk{t.position}_member" name="talk{t.position}_member" form="programForm" options={t.options} value={t.memberId} /></div>
				<div class="field"><label for="talk{t.position}_topic">Thema</label><input id="talk{t.position}_topic" name="talk{t.position}_topic" type="text" form="programForm" value={t.topic ?? ''} /></div>
			</div>
			<div class="grid-3">
				<div class="field"><label for="talk{t.position}_duration">Dauer (Minuten)</label><input id="talk{t.position}_duration" name="talk{t.position}_duration" type="number" min="1" max="60" form="programForm" value={t.durationMinutes ?? ''} /></div>
				<div class="field">
					<label for="talk{t.position}_status">Status</label>
					<select id="talk{t.position}_status" name="talk{t.position}_status" form="programForm">{#each statuses as s}<option value={s.value} selected={s.value === t.status}>{s.label}</option>{/each}</select>
				</div>
				<div class="field"><label for="talk{t.position}_note">Notiz</label><input id="talk{t.position}_note" name="talk{t.position}_note" type="text" form="programForm" value={t.note ?? ''} /></div>
			</div>
		</div>
	{/if}
{/snippet}

<p class="no-print"><a href="/">← Sonntage</a></p>

{#if data.missing}
	<h1>{data.dateLabel}</h1>
	<div class="card">
		<p>Für diesen Sonntag gibt es noch keinen Eintrag.</p>
		{#if data.canCreate}
			<form method="POST" action="?/create" use:enhance><button class="btn btn-primary" type="submit">Sonntag anlegen</button></form>
		{:else}
			<p class="muted">Die Bischofschaft kann ihn anlegen.</p>
		{/if}
	</div>
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="has-savebar" onchange={onFieldChange} oninput={(e) => changedFields.mark(e.target)} onfocusin={(e) => changedFields.focus(e.target)} onfocusout={(e) => changedFields.release(e.target, pending > 0 || dirty.size > 0)} onkeydown={onFieldKey}>
		<div class="section-title">
			<div>
				<span class="kind-tag">{data.kinds.find((k) => k.value === data.meeting.kind)?.label}</span>
				<h1>{data.dateLabel}</h1>
			</div>
			{#if data.canPrint}
				<div class="actions">
					<a class="btn btn-icon" href="/sonntag/{data.date}/druck?vollbild=1" aria-label="Vollbild" title="Vollbild"><Icon name="expand" /><span>Vollbild</span></a>
					<a class="btn btn-icon" href="/sonntag/{data.date}/druck" aria-label="Drucken" title="Drucken"><Icon name="print" /><span>Drucken</span></a>
				</div>
			{/if}
		</div>
		{#if formError}<div class="error">{formError}</div>{/if}

		{#if tabs.length > 1}
			<nav class="subnav tabs" aria-label="Bereiche">
				{#each tabs as t (t.key)}
					<button type="button" class:active={active === t.key} aria-selected={active === t.key} role="tab" onclick={() => selectTab(t.key)}>
						{t.label}{#if t.open.length}<span class="tab-badge" title={t.open.join(', ')}>{t.open.length}</span>{/if}
					</button>
				{/each}
			</nav>
		{/if}

		{#if data.showProgram}
			<form
				id="programForm"
				method="POST"
				action="?/program"
				use:enhance={() => saved('program')}
			><input type="hidden" name="version" value={data.versions.program} /></form>
		{/if}
		{#if !data.showProgram && data.canPrayers}
			<form
				id="prayersForm"
				method="POST"
				action="?/prayers"
				use:enhance={() => saved('prayers')}
			><input type="hidden" name="version" value={data.versions.prayers} /></form>
		{/if}
		{#if data.canMusic}
			<form
				id="musicForm"
				method="POST"
				action="?/music"
				use:enhance={() => saved('music')}
			><input type="hidden" name="version" value={data.versions.music} /></form>
		{:else if data.canConductor}
			<form
				id="conductorForm"
				method="POST"
				action="?/conductor"
				use:enhance={() => saved('conductor')}
			><input type="hidden" name="version" value={data.versions.conductor} /></form>
		{/if}

		{#if !prayersOnly}
			<div class="tab-panel" hidden={active !== 'allgemein'}>
				<div class="section">
					<div class="grid-2">
						<div class="field">
							<label for="kind">Typ</label>
							{#if data.showProgram}
								<select id="kind" name="kind" form="programForm">{#each data.kinds as k}<option value={k.value} selected={k.value === data.meeting.kind}>{k.label}</option>{/each}</select>
							{:else}
								<p>{data.kinds.find((k) => k.value === data.meeting.kind)?.label}</p>
							{/if}
						</div>
						{#if data.showProgram && data.hasProgram}
							<div class="field"><label for="presiding">Leitung</label><MemberSelect id="presiding" name="presiding" form="programForm" options={data.presidingOptions} value={data.meeting.presidingMemberId} /></div>
						{/if}
					</div>
					{#if !data.hasProgram}
						<p class="hint">Für diesen Sonntagstyp gibt es kein Programm: keine Leitung, kein Thema, keine Gebete, Ansprachen oder Lieder.</p>
					{:else}
						<div class="field">
							<label for="theme">Thema</label>
							{#if data.showProgram}
								<input id="theme" name="theme" type="text" form="programForm" value={data.meeting.theme ?? ''} />
							{:else}
								<p>{data.meeting.theme ?? '–'}</p>
							{/if}
						</div>
						<div class="grid-2">
							<div class="field">
								<label for="specialNote">Besonderes</label>
								{#if data.showProgram}
									<input id="specialNote" name="specialNote" type="text" form="programForm" value={data.meeting.specialNote ?? ''} placeholder="z.B. Kindersegnung, FSY-Teilnehmer" />
								{:else if data.meeting.specialNote}
									<p>{data.meeting.specialNote}</p>
								{:else}
									<p class="muted">–</p>
								{/if}
							</div>
							{#if data.showProgram}
								<div class="field">
									<span class="label">Abwesend (Bischofschaft)</span>
									{#if data.absenceOptions.length}
										<div class="check-list">
											{#each data.absenceOptions as o}
												<label class="check"><input type="checkbox" name="absent" value={o.id} form="programForm" checked={data.meeting.absenceIds?.includes(o.id)} /> {o.label}</label>
											{/each}
										</div>
									{:else}
										<p class="hint">Bischofschaft noch nicht festgelegt. Ein Admin kann sie unter Einstellungen erfassen.</p>
									{/if}
									{#if data.meeting.absencesLegacy}<p class="hint">Bisheriger Eintrag: {data.meeting.absencesLegacy}</p>{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if data.hasProgram}
			{#if data.showProgram}
				<div class="tab-panel" hidden={active !== 'begruessung'}>
					<div class="section">
						<div class="grid-2">
							<div class="field"><label for="guest">Gast (Pfahl)</label><MemberSelect id="guest" name="guest" form="programForm" options={data.guestOptions} value={data.meeting.guestMemberId} /></div>
							<div class="field">
								<label for="chair">Vorsitz</label>
								<MemberSelect
									id="chair"
									name="chair"
									form="programForm"
									options={data.chairOptions.map((o) => ({ ...o, hint: '' }))}
									value={data.meeting.chairMemberId}
									placeholder={chairAutoLabel}
									emptyLabel={chairAutoLabel}
								/>
							</div>
						</div>
						<p class="hint">Automatisch: Gast mit Vorsitz, sonst Bischof, sonst 1. oder 2. Ratgeber, je nach Abwesenheit. Wird nach jeder Änderung neu berechnet.</p>
					</div>
					<div class="section">
						<h2>Bekanntmachungen</h2>
						<ul class="row-list">
							{#each announcements as a, i}
								<li>
									<input type="text" name="announcement" form="programForm" bind:value={announcements[i]} placeholder="Text der Bekanntmachung" />
									<button class="btn btn-small" type="button" onclick={() => { move(announcements, i, -1); touch('programForm'); }} aria-label="nach oben">↑</button>
									<button class="btn btn-small" type="button" onclick={() => { move(announcements, i, 1); touch('programForm'); }} aria-label="nach unten">↓</button>
									<button class="btn btn-small btn-danger" type="button" onclick={() => { announcements.splice(i, 1); touch('programForm'); }} aria-label="entfernen">✕</button>
								</li>
							{/each}
						</ul>
						<div class="actions">
							<button class="btn" type="button" onclick={() => announcements.push('')}>Zeile hinzufügen</button>
						</div>
					</div>
				</div>

				<div class="tab-panel" hidden={active !== 'aenderungen'}>
					<div class="section">
						<div class="grid-2">
							<div>
								<h2>Entlassungen</h2>
								<ul class="row-list">
									{#each releases as r, i}
										<li class="calling-row">
											{@render personSelect('release_person', releases[i], `release_person_${i}`)}
											<input type="text" name="release_calling" form="programForm" bind:value={releases[i].calling} placeholder="Amt" />
											<button class="btn btn-small btn-danger" type="button" onclick={() => { releases.splice(i, 1); touch('programForm'); }} aria-label="entfernen">✕</button>
										</li>
									{/each}
								</ul>
								<button class="btn btn-small" type="button" onclick={() => releases.push({ person: '', personName: '', calling: '' })}>Entlassung hinzufügen</button>
							</div>
							<div>
								<h2>Berufungen</h2>
								<ul class="row-list">
									{#each sustainings as s, i}
										<li class="calling-row">
											{@render personSelect('sustain_person', sustainings[i], `sustain_person_${i}`)}
											<input type="text" name="sustain_calling" form="programForm" bind:value={sustainings[i].calling} placeholder="Amt" />
											<button class="btn btn-small btn-danger" type="button" onclick={() => { sustainings.splice(i, 1); touch('programForm'); }} aria-label="entfernen">✕</button>
										</li>
									{/each}
								</ul>
								<button class="btn btn-small" type="button" onclick={() => sustainings.push({ person: '', personName: '', calling: '' })}>Berufung hinzufügen</button>
							</div>
						</div>
					</div>
					<div class="section">
						<label class="check"><input type="checkbox" name="stakeChanges" value="1" form="programForm" checked={data.meeting.stakeChanges} /> Beamtenänderungen vom Pfahl</label>
						<p class="hint">Setzt auf dem Leitungszettel einen Hinweis, dass der Pfahl Entlassungen und Berufungen bekanntgibt.</p>
					</div>
				</div>
			{/if}

			{#if data.showHymns}
				<div class="tab-panel" hidden={active !== 'musik'}>
					<div class="section">
						<h2>Lieder</h2>
						<div class="grid-2">
							{@render hymnRow(findHymn('anfang'))}
							{@render hymnRow(findHymn('abendmahl'))}
							{#if !isFast}{@render hymnRow(findHymn('zwischen'))}{/if}
							{@render hymnRow(findHymn('schluss'))}
						</div>
					</div>
					<div class="section">
						<h2>Orgel / Klavier und Dirigieren</h2>
						{#if data.canMusic}
							<div class="grid-2">
								<div class="field"><label for="organist">Orgel / Klavier</label><MemberSelect id="organist" name="organist" form="musicForm" options={data.organistOptions} value={data.meeting.organistMemberId} /></div>
								<div class="field"><label for="conductor">Dirigieren</label><MemberSelect id="conductor" name="conductor" form="musicForm" options={data.conductorOptions} value={data.meeting.conductorMemberId} /></div>
							</div>
							<div class="field"><label for="musicNote">Notiz Musik</label><input id="musicNote" name="musicNote" type="text" form="musicForm" value={data.meeting.musicNote ?? ''} /></div>
						{:else if data.canConductor}
							<p><strong>Orgel / Klavier:</strong> {data.organistName ?? '–'}</p>
							<div class="field"><label for="conductor">Dirigieren</label><MemberSelect id="conductor" name="conductor" form="conductorForm" options={data.conductorOptions} value={data.meeting.conductorMemberId} /></div>
							{#if data.meeting.musicNote}<p class="hint">{data.meeting.musicNote}</p>{/if}
						{:else}
							<p><strong>Orgel / Klavier:</strong> {data.organistName ?? '–'} · <strong>Dirigieren:</strong> {data.conductorName ?? '–'}</p>
							{#if data.meeting.musicNote}<p class="hint">{data.meeting.musicNote}</p>{/if}
						{/if}
					</div>
				</div>
			{/if}

			{#if data.showProgram || data.canPrayers}
				<div class="tab-panel" hidden={active !== 'gebete'}>
					<div class="section">
						<div class="grid-2">
							{#each data.prayers as p (p.position)}
								<div class="field"><label for="prayer{p.position}">{p.label}</label><MemberSelect id="prayer{p.position}" name="prayer{p.position}_member" form={prayerForm} options={p.options} value={p.memberId} /></div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			{#if data.showProgram && !isFast}
				<div class="tab-panel" hidden={active !== 'ansprachen'}>
					<div class="section">
						{@render talkCard(findTalk(1), data.statuses)}
						{@render talkCard(findTalk(2), data.statuses)}
						{@render talkCard(findTalk(3), data.statuses)}
						{#if showFourth}
							{@render talkCard(findTalk(4), data.statuses)}
						{/if}
						{#if !showFourth}
							<div class="actions"><button class="btn" type="button" onclick={() => (showFourth = true)}>4. Ansprache hinzufügen</button></div>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<div class="savebar no-print">
		<span class="savebar-status" class:err={saveStatus.kind === 'error'}>{saveStatus.text}</span>
		{#if conflict}<button class="btn btn-primary" type="button" onclick={() => location.reload()}>Seite neu laden</button>{/if}
	</div>
{/if}
