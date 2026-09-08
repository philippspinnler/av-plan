<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import MemberSelect from '$lib/components/MemberSelect.svelte';
	import { PRINT_TEXTS } from '$lib/print/texts';
	let { data, form } = $props();

	let announcements = $state<string[]>([]);
	let releases = $state<{ personName: string; calling: string }[]>([]);
	let sustainings = $state<{ personName: string; calling: string }[]>([]);
	let showQuickAdd = $state(false);
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
			releases = [...data.releases];
			sustainings = [...data.sustainings];
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

	function saveAll() {
		if (data.missing) return;
		results = {};
		if (data.showProgram) (document.getElementById('programForm') as HTMLFormElement | null)?.requestSubmit();
		if (data.canMusic) (document.getElementById('musicForm') as HTMLFormElement | null)?.requestSubmit();
		else if (data.canConductor) (document.getElementById('conductorForm') as HTMLFormElement | null)?.requestSubmit();
	}

	const saveStatus = $derived.by(() => {
		const entries = Object.values(results);
		const errors = entries.filter((r) => !r.ok).map((r) => r.error ?? 'Fehler');
		if (errors.length) return { kind: 'error' as const, text: errors.join(' · ') };
		if (entries.length && entries.every((r) => r.ok)) return { kind: 'ok' as const, text: 'Gespeichert' };
		return { kind: 'hint' as const, text: 'Änderungen werden erst mit Speichern übernommen' };
	});
</script>

{#snippet hymnRow(h: { slot: string; label: string; value: string; freeText: string | null } | undefined)}
	{#if h}
		<div class="field">
			<label for="hymn_{h.slot}">{h.label}</label>
			{#if data.canMusic}
				<input id="hymn_{h.slot}" name="hymn_{h.slot}" type="text" list="hymnlist" form="musicForm" value={h.value} placeholder="Nummer oder Titel tippen" autocomplete="off" />
				{#if h.slot === 'zwischen'}
					<input type="text" name="zwischen_text" form="musicForm" value={h.freeText ?? ''} placeholder="oder Musikeinlage, z.B. PV singt" />
				{/if}
			{:else}
				<p>{h.value || h.freeText || '–'}</p>
			{/if}
		</div>
	{/if}
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
	<div class="has-savebar">
		<div class="section-title">
			<div>
				<span class="kind-tag">{data.kinds.find((k) => k.value === data.meeting.kind)?.label}</span>
				<h1>{data.dateLabel}</h1>
			</div>
			{#if data.canPrint}<a class="btn" href="/sonntag/{data.date}/druck">Drucken</a>{/if}
		</div>
		{#if form?.error}<div class="error">{form.error}</div>{/if}
		{#if form?.added}<div class="success">{form.added} wurde angelegt und kann jetzt ausgewählt werden.</div>{/if}

		<!-- 1. Kopf -->
		<div class="section flow-step">
			<h2>1. Kopf</h2>
			<p class="field-static"><strong>Datum:</strong> {data.dateLabel}</p>
			<div class="grid-2">
				<div class="field">
					<label for="kind">Typ</label>
					{#if data.showProgram}
						<select id="kind" name="kind" form="programForm">{#each data.kinds as k}<option value={k.value} selected={k.value === data.meeting.kind}>{k.label}</option>{/each}</select>
					{:else}
						<p>{data.kinds.find((k) => k.value === data.meeting.kind)?.label}</p>
					{/if}
				</div>
				{#if data.showProgram}
					<div class="field"><label for="presiding">Leitung</label><MemberSelect id="presiding" name="presiding" form="programForm" options={data.presidingOptions} value={data.meeting.presidingMemberId} /></div>
				{/if}
			</div>
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
					{/if}
				</div>
				{#if data.showProgram}
					<div class="field"><label for="absences">Abwesenheiten Bischofschaft</label><input id="absences" name="absences" type="text" form="programForm" value={data.meeting.absences ?? ''} /></div>
				{/if}
			</div>
		</div>

		{#if data.showProgram}
			<form
				id="programForm"
				method="POST"
				action="?/program"
				use:enhance={() => {
					pending++;
					return async ({ result, update }) => {
						pending--;
						results.program = result.type === 'success' ? { ok: true } : { ok: false, error: result.type === 'failure' ? String(result.data?.error ?? 'Fehler') : 'Fehler' };
						await update();
					};
				}}
			></form>
		{/if}
		{#if data.canMusic}
			<form
				id="musicForm"
				method="POST"
				action="?/music"
				use:enhance={() => {
					pending++;
					return async ({ result, update }) => {
						pending--;
						results.music = result.type === 'success' ? { ok: true } : { ok: false, error: result.type === 'failure' ? String(result.data?.error ?? 'Fehler') : 'Fehler' };
						await update();
					};
				}}
			></form>
		{:else if data.canConductor}
			<form
				id="conductorForm"
				method="POST"
				action="?/conductor"
				use:enhance={() => {
					pending++;
					return async ({ result, update }) => {
						pending--;
						results.conductor = result.type === 'success' ? { ok: true } : { ok: false, error: result.type === 'failure' ? String(result.data?.error ?? 'Fehler') : 'Fehler' };
						await update();
					};
				}}
			></form>
		{/if}
		<datalist id="hymnlist">{#each data.hymnList as h}<option value={h}></option>{/each}</datalist>

		{#if data.hasProgram}
			{#if data.showProgram}
				<!-- 2. Begrüssung und Bekanntmachungen -->
				<div class="section flow-step">
					<h2>2. Begrüssung und Bekanntmachungen</h2>
					<ul class="greeting-list">
						{#each PRINT_TEXTS.greetingItems as g}<li class="muted">{g}</li>{/each}
					</ul>
					<ul class="row-list">
						{#each announcements as a, i}
							<li>
								<input type="text" name="announcement" form="programForm" bind:value={announcements[i]} placeholder="Text der Bekanntmachung" />
								<button class="btn btn-small" type="button" onclick={() => move(announcements, i, -1)} aria-label="nach oben">↑</button>
								<button class="btn btn-small" type="button" onclick={() => move(announcements, i, 1)} aria-label="nach unten">↓</button>
								<button class="btn btn-small btn-danger" type="button" onclick={() => announcements.splice(i, 1)} aria-label="entfernen">✕</button>
							</li>
						{/each}
					</ul>
					<div class="actions">
						<button class="btn" type="button" onclick={() => announcements.push('')}>Zeile hinzufügen</button>
					</div>
				</div>
			{/if}

			<!-- 3. Anfangslied -->
			<div class="section flow-step">
				<h2>3. Anfangslied</h2>
				{@render hymnRow(findHymn('anfang'))}
			</div>

			{#if data.showProgram}
				<!-- 4. Anfangsgebet -->
				<div class="section flow-step">
					<h2>4. Anfangsgebet</h2>
					{#each data.prayers.filter((p) => p.position === 1) as p}
						<div class="grid-2">
							<div class="field"><label for="prayer{p.position}">{p.label}</label><MemberSelect id="prayer{p.position}" name="prayer{p.position}_member" form="programForm" options={p.options} value={p.memberId} /></div>
							<div class="field">
								<label for="prayer{p.position}_status">Status</label>
								<select id="prayer{p.position}_status" name="prayer{p.position}_status" form="programForm">{#each data.statuses as s}<option value={s.value} selected={s.value === p.status}>{s.label}</option>{/each}</select>
							</div>
						</div>
					{/each}
				</div>

				<!-- 5. Entlassungen und Berufungen -->
				<div class="section flow-step">
					<h2>5. Entlassungen und Berufungen</h2>
					<div class="grid-2">
						<div>
							<h3>Entlassungen</h3>
							<ul class="row-list">
								{#each releases as r, i}
									<li>
										<input type="text" name="release_name" form="programForm" bind:value={releases[i].personName} placeholder="Name" />
										<input type="text" name="release_calling" form="programForm" bind:value={releases[i].calling} placeholder="Amt" />
										<button class="btn btn-small btn-danger" type="button" onclick={() => releases.splice(i, 1)} aria-label="entfernen">✕</button>
									</li>
								{/each}
							</ul>
							<button class="btn btn-small" type="button" onclick={() => releases.push({ personName: '', calling: '' })}>Entlassung hinzufügen</button>
						</div>
						<div>
							<h3>Berufungen</h3>
							<ul class="row-list">
								{#each sustainings as s, i}
									<li>
										<input type="text" name="sustain_name" form="programForm" bind:value={sustainings[i].personName} placeholder="Name" />
										<input type="text" name="sustain_calling" form="programForm" bind:value={sustainings[i].calling} placeholder="Amt" />
										<button class="btn btn-small btn-danger" type="button" onclick={() => sustainings.splice(i, 1)} aria-label="entfernen">✕</button>
									</li>
								{/each}
							</ul>
							<button class="btn btn-small" type="button" onclick={() => sustainings.push({ personName: '', calling: '' })}>Berufung hinzufügen</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- 6. Abendmahlslied und Abendmahl -->
			<div class="section flow-step">
				<h2>6. Abendmahlslied und Abendmahl</h2>
				{@render hymnRow(findHymn('abendmahl'))}
				<p class="muted">{PRINT_TEXTS.sacramentThanks}</p>
			</div>

			{#if data.showProgram}
				<!-- 7. Ansprache 1 und 2 -->
				<div class="section flow-step">
					<h2>7. {data.meeting.kind === 'fastsonntag' ? 'Zeugnisse (Fastsonntag)' : 'Ansprache 1 und 2'}</h2>
					{#if data.meeting.kind === 'fastsonntag'}
						<p class="hint">Am Fastsonntag stehen die Geschwister für Zeugnisse auf; die Felder unten bleiben nutzbar, falls trotzdem Sprecher eingeteilt sind.</p>
					{/if}
					{@render talkCard(findTalk(1), data.statuses)}
					{@render talkCard(findTalk(2), data.statuses)}
					{#if data.canAddMember}
						<div class="actions">
							<button class="btn" type="button" onclick={() => (showQuickAdd = !showQuickAdd)}>Neue Person anlegen</button>
						</div>
						{#if showQuickAdd}
							<form method="POST" action="?/quickAdd" use:enhance class="card grid-3">
								<div class="field"><label for="qa-fn">Vorname</label><input id="qa-fn" name="firstName" type="text" required /></div>
								<div class="field"><label for="qa-ln">Nachname</label><input id="qa-ln" name="lastName" type="text" /></div>
								<div class="field"><label for="qa-af">Zugehörigkeit</label><input id="qa-af" name="affiliation" type="text" placeholder="leer für Gemeindemitglied" /></div>
								<div class="actions"><button class="btn btn-primary" type="submit">Anlegen</button></div>
							</form>
						{/if}
					{/if}
				</div>
			{/if}

			{#if data.meeting.kind !== 'fastsonntag'}
				<!-- 8. Zwischenlied -->
				<div class="section flow-step">
					<h2>8. Zwischenlied</h2>
					{@render hymnRow(findHymn('zwischen'))}
				</div>
			{/if}

			{#if data.showProgram}
				<!-- 9. Ansprache 3 (+4) -->
				<div class="section flow-step">
					<h2>9. {showFourth ? 'Ansprache 3 und 4' : 'Ansprache 3'}</h2>
					{@render talkCard(findTalk(3), data.statuses)}
					{#if showFourth}
						{@render talkCard(findTalk(4), data.statuses)}
					{/if}
					{#if !showFourth}
						<div class="actions"><button class="btn" type="button" onclick={() => (showFourth = true)}>4. Ansprache hinzufügen</button></div>
					{/if}
				</div>
			{/if}

			<!-- 10. Schlusslied -->
			<div class="section flow-step">
				<h2>10. Schlusslied</h2>
				{@render hymnRow(findHymn('schluss'))}
			</div>

			{#if data.showProgram}
				<!-- 11. Schlussgebet -->
				<div class="section flow-step">
					<h2>11. Schlussgebet</h2>
					{#each data.prayers.filter((p) => p.position === 2) as p}
						<div class="grid-2">
							<div class="field"><label for="prayer{p.position}">{p.label}</label><MemberSelect id="prayer{p.position}" name="prayer{p.position}_member" form="programForm" options={p.options} value={p.memberId} /></div>
							<div class="field">
								<label for="prayer{p.position}_status">Status</label>
								<select id="prayer{p.position}_status" name="prayer{p.position}_status" form="programForm">{#each data.statuses as s}<option value={s.value} selected={s.value === p.status}>{s.label}</option>{/each}</select>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- 12. Orgel / Klavier, Dirigieren, Notiz Musik -->
			<div class="section flow-step">
				<h2>12. Orgel / Klavier, Dirigieren, Notiz Musik</h2>
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
		{:else}
			<div class="card"><p class="muted">Für diesen Sonntagstyp gibt es kein Programm (keine Gebete, Ansprachen oder Lieder).</p></div>
		{/if}
	</div>

	<div class="savebar no-print">
		<span class="savebar-status" class:err={saveStatus.kind === 'error'}>{saveStatus.text}</span>
		<button class="btn btn-primary" type="button" disabled={pending > 0} onclick={saveAll}>Speichern</button>
	</div>
{/if}
