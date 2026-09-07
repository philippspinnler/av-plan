<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import MemberSelect from '$lib/components/MemberSelect.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	let { data, form } = $props();

	let announcements = $state<string[]>([]);
	let releases = $state<{ personName: string; calling: string }[]>([]);
	let sustainings = $state<{ personName: string; calling: string }[]>([]);
	let showQuickAdd = $state(false);
	let seededAnnouncements = $state<string | null>(null);
	let seededCallings = $state<string | null>(null);

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

	const saved = (key: string) => form?.saved === key;
	function move<T>(arr: T[], i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= arr.length) return;
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
</script>

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
	<div class="section-title">
		<div>
			<span class="kind-tag">{data.kinds.find((k) => k.value === data.meeting.kind)?.label}</span>
			<h1>{data.dateLabel}</h1>
		</div>
		<a class="btn" href="/sonntag/{data.date}/druck">Drucken</a>
	</div>
	{#if form?.error}<div class="error">{form.error}</div>{/if}
	{#if form?.added}<div class="success">{form.added} wurde angelegt und kann jetzt ausgewählt werden.</div>{/if}

	<!-- Allgemein -->
	<div class="section" class:readonly={!data.canProgram}>
		<div class="section-title"><h2>Allgemein</h2>{#if saved('general')}<span class="badge badge-zugesagt">Gespeichert</span>{/if}</div>
		{#if data.canProgram}
			<form method="POST" action="?/general" use:enhance>
				<div class="grid-2">
					<div class="field">
						<label for="kind">Typ</label>
						<select id="kind" name="kind">{#each data.kinds as k}<option value={k.value} selected={k.value === data.meeting.kind}>{k.label}</option>{/each}</select>
					</div>
					<div class="field"><label for="presiding">Leitung</label><MemberSelect id="presiding" name="presiding" options={data.presidingOptions} value={data.meeting.presidingMemberId} /></div>
				</div>
				<div class="field"><label for="theme">Thema</label><input id="theme" name="theme" type="text" value={data.meeting.theme ?? ''} /></div>
				<div class="grid-2">
					<div class="field"><label for="specialNote">Besonderes</label><input id="specialNote" name="specialNote" type="text" value={data.meeting.specialNote ?? ''} placeholder="z.B. Kindersegnung, FSY-Teilnehmer" /></div>
					<div class="field"><label for="absences">Abwesenheiten Bischofschaft</label><input id="absences" name="absences" type="text" value={data.meeting.absences ?? ''} /></div>
				</div>
				<button class="btn btn-primary" type="submit">Speichern</button>
			</form>
		{:else}
			<p><strong>Thema:</strong> {data.meeting.theme ?? '–'}</p>
			<p><strong>Leitung:</strong> {data.presidingName ?? '–'}{#if data.meeting.specialNote} · <strong>Besonderes:</strong> {data.meeting.specialNote}{/if}</p>
		{/if}
	</div>

	{#if data.hasProgram}
		<!-- Gebete -->
		<div class="section" class:readonly={!data.canProgram}>
			<div class="section-title"><h2>Gebete</h2>{#if saved('prayers')}<span class="badge badge-zugesagt">Gespeichert</span>{/if}</div>
			{#if data.canProgram}
				<form method="POST" action="?/prayers" use:enhance>
					<div class="grid-2">
						{#each data.prayers as p}
							<div>
								<div class="field"><label for="prayer{p.position}">{p.label}</label><MemberSelect id="prayer{p.position}" name="prayer{p.position}_member" options={p.options} value={p.memberId} /></div>
								<div class="field">
									<label for="prayer{p.position}_status">Status</label>
									<select id="prayer{p.position}_status" name="prayer{p.position}_status">{#each data.statuses as s}<option value={s.value} selected={s.value === p.status}>{s.label}</option>{/each}</select>
								</div>
							</div>
						{/each}
					</div>
					<button class="btn btn-primary" type="submit">Speichern</button>
				</form>
			{:else}
				{#each data.prayers as p}<p><strong>{p.label}:</strong> {p.memberName ?? '–'} <StatusBadge status={p.status} /></p>{/each}
			{/if}
		</div>

		<!-- Ansprachen -->
		<div class="section" class:readonly={!data.canProgram}>
			<div class="section-title"><h2>{data.meeting.kind === 'fastsonntag' ? 'Ansprachen (Fastsonntag: Zeugnisse)' : 'Ansprachen'}</h2>{#if saved('talks')}<span class="badge badge-zugesagt">Gespeichert</span>{/if}</div>
			{#if data.canProgram}
				<form method="POST" action="?/talks" use:enhance>
					<div class="field" style="max-width: 12rem"><label for="talksStartTime">Beginn der Ansprachen</label><input id="talksStartTime" name="talksStartTime" type="time" value={data.meeting.talksStartTime} /></div>
					{#each data.talks as t}
						<div class="card">
							<strong>Ansprache {t.position}</strong>
							<div class="grid-2">
								<div class="field"><label for="talk{t.position}_member">Sprecher</label><MemberSelect id="talk{t.position}_member" name="talk{t.position}_member" options={t.options} value={t.memberId} /></div>
								<div class="field"><label for="talk{t.position}_topic">Thema</label><input id="talk{t.position}_topic" name="talk{t.position}_topic" type="text" value={t.topic ?? ''} /></div>
							</div>
							<div class="grid-3">
								<div class="field"><label for="talk{t.position}_duration">Dauer (Minuten)</label><input id="talk{t.position}_duration" name="talk{t.position}_duration" type="number" min="1" max="60" value={t.durationMinutes ?? ''} /></div>
								<div class="field">
									<label for="talk{t.position}_status">Status</label>
									<select id="talk{t.position}_status" name="talk{t.position}_status">{#each data.statuses as s}<option value={s.value} selected={s.value === t.status}>{s.label}</option>{/each}</select>
								</div>
								<div class="field"><label for="talk{t.position}_note">Notiz</label><input id="talk{t.position}_note" name="talk{t.position}_note" type="text" value={t.note ?? ''} /></div>
							</div>
						</div>
					{/each}
					<div class="actions">
						<button class="btn btn-primary" type="submit">Speichern</button>
						{#if !data.showFourth}<a class="btn" href="/sonntag/{data.date}?vier=1">4. Ansprache hinzufügen</a>{/if}
						{#if data.canAddMember}<button class="btn" type="button" onclick={() => (showQuickAdd = !showQuickAdd)}>Neue Person anlegen</button>{/if}
					</div>
				</form>
				{#if showQuickAdd}
					<form method="POST" action="?/quickAdd" use:enhance class="card grid-3">
						<div class="field"><label for="qa-fn">Vorname</label><input id="qa-fn" name="firstName" type="text" required /></div>
						<div class="field"><label for="qa-ln">Nachname</label><input id="qa-ln" name="lastName" type="text" /></div>
						<div class="field"><label for="qa-af">Zugehörigkeit</label><input id="qa-af" name="affiliation" type="text" placeholder="leer für Gemeindemitglied" /></div>
						<div class="actions"><button class="btn btn-primary" type="submit">Anlegen</button></div>
					</form>
				{/if}
			{:else}
				{#each data.talks as t}
					{#if t.memberName || t.topic}<p><strong>Ansprache {t.position}:</strong> {t.memberName ?? '–'}{#if t.topic} · {t.topic}{/if} <StatusBadge status={t.status} /></p>{/if}
				{/each}
			{/if}
		</div>

		<!-- Bekanntmachungen -->
		<div class="section" class:readonly={!data.canProgram}>
			<div class="section-title"><h2>Bekanntmachungen</h2>{#if saved('announcements')}<span class="badge badge-zugesagt">Gespeichert</span>{/if}</div>
			{#if data.canProgram}
				<form method="POST" action="?/announcements" use:enhance>
					<ul class="row-list">
						{#each announcements as a, i}
							<li>
								<input type="text" name="announcement" bind:value={announcements[i]} placeholder="Text der Bekanntmachung" />
								<button class="btn btn-small" type="button" onclick={() => move(announcements, i, -1)} aria-label="nach oben">↑</button>
								<button class="btn btn-small" type="button" onclick={() => move(announcements, i, 1)} aria-label="nach unten">↓</button>
								<button class="btn btn-small btn-danger" type="button" onclick={() => announcements.splice(i, 1)} aria-label="entfernen">✕</button>
							</li>
						{/each}
					</ul>
					<div class="actions">
						<button class="btn" type="button" onclick={() => announcements.push('')}>Zeile hinzufügen</button>
						<button class="btn btn-primary" type="submit">Speichern</button>
					</div>
				</form>
			{:else if data.announcements.length}
				<ul>{#each data.announcements as a}<li>{a}</li>{/each}</ul>
			{:else}
				<p class="muted">Keine Bekanntmachungen.</p>
			{/if}
		</div>

		<!-- Entlassungen und Berufungen -->
		<div class="section" class:readonly={!data.canProgram}>
			<div class="section-title"><h2>Entlassungen und Berufungen</h2>{#if saved('callings')}<span class="badge badge-zugesagt">Gespeichert</span>{/if}</div>
			{#if data.canProgram}
				<form method="POST" action="?/callings" use:enhance>
					<div class="grid-2">
						<div>
							<h3>Entlassungen</h3>
							<ul class="row-list">
								{#each releases as r, i}
									<li>
										<input type="text" name="release_name" bind:value={releases[i].personName} placeholder="Name" />
										<input type="text" name="release_calling" bind:value={releases[i].calling} placeholder="Amt" />
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
										<input type="text" name="sustain_name" bind:value={sustainings[i].personName} placeholder="Name" />
										<input type="text" name="sustain_calling" bind:value={sustainings[i].calling} placeholder="Amt" />
										<button class="btn btn-small btn-danger" type="button" onclick={() => sustainings.splice(i, 1)} aria-label="entfernen">✕</button>
									</li>
								{/each}
							</ul>
							<button class="btn btn-small" type="button" onclick={() => sustainings.push({ personName: '', calling: '' })}>Berufung hinzufügen</button>
						</div>
					</div>
					<div class="actions"><button class="btn btn-primary" type="submit">Speichern</button></div>
				</form>
			{:else}
				{#if data.releases.length}<p><strong>Entlassungen:</strong> {data.releases.map((r) => `${r.personName} (${r.calling})`).join(', ')}</p>{/if}
				{#if data.sustainings.length}<p><strong>Berufungen:</strong> {data.sustainings.map((r) => `${r.personName} (${r.calling})`).join(', ')}</p>{/if}
				{#if !data.releases.length && !data.sustainings.length}<p class="muted">Keine.</p>{/if}
			{/if}
		</div>

		<!-- Musik -->
		<div class="section" class:readonly={!data.canMusic}>
			<div class="section-title"><h2>Musik</h2>{#if saved('music')}<span class="badge badge-zugesagt">Gespeichert</span>{/if}</div>
			{#if data.canMusic}
				<form method="POST" action="?/music" use:enhance>
					<datalist id="hymnlist">{#each data.hymnList as h}<option value={h}></option>{/each}</datalist>
					<div class="grid-2">
						{#each data.hymns as h}
							<div class="field">
								<label for="hymn_{h.slot}">{h.label}</label>
								<input id="hymn_{h.slot}" name="hymn_{h.slot}" type="text" list="hymnlist" value={h.value} placeholder="Nummer oder Titel tippen" autocomplete="off" />
								{#if h.slot === 'zwischen'}
									<input type="text" name="zwischen_text" value={h.freeText ?? ''} placeholder="oder Musikeinlage, z.B. PV singt" />
								{/if}
							</div>
						{/each}
					</div>
					<div class="grid-2">
						<div class="field"><label for="organist">Orgel / Klavier</label><MemberSelect id="organist" name="organist" options={data.organistOptions} value={data.meeting.organistMemberId} /></div>
						<div class="field"><label for="conductor">Dirigieren</label><MemberSelect id="conductor" name="conductor" options={data.conductorOptions} value={data.meeting.conductorMemberId} /></div>
					</div>
					<div class="field"><label for="musicNote">Notiz Musik</label><input id="musicNote" name="musicNote" type="text" value={data.meeting.musicNote ?? ''} /></div>
					<button class="btn btn-primary" type="submit">Speichern</button>
				</form>
			{:else}
				{#each data.hymns as h}<p><strong>{h.label}:</strong> {h.value || h.freeText || '–'}</p>{/each}
				<p><strong>Orgel:</strong> {data.organistName ?? '–'} · <strong>Dirigieren:</strong> {data.conductorName ?? '–'}</p>
				{#if data.meeting.musicNote}<p class="hint">{data.meeting.musicNote}</p>{/if}
			{/if}
		</div>
	{:else}
		<div class="card"><p class="muted">Für diesen Sonntagstyp gibt es kein Programm (keine Gebete, Ansprachen oder Lieder).</p></div>
	{/if}
{/if}
