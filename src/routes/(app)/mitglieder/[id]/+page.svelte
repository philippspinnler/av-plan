<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	const m = $derived(data.member);
	// svelte-ignore state_referenced_locally -- initial value only
	let kind = $state(data.member.kind);
</script>

<p><a href="/mitglieder">← Mitglieder</a></p>
<h1>{data.title}</h1>
{#if form?.error}<div class="error">{form.error}</div>{/if}
{#if form?.saved}<div class="success">Gespeichert.</div>{/if}

<div class="section">
	{#if data.canEdit}
		<form method="POST" action="?/update" use:enhance>
			<div class="grid-3">
				<div class="field"><label for="fn">Vorname</label><input id="fn" name="firstName" type="text" required value={m.firstName} /></div>
				<div class="field"><label for="ln">Nachname</label><input id="ln" name="lastName" type="text" value={m.lastName} /></div>
				<div class="field">
					<label for="kind">Art</label>
					<select id="kind" name="kind" bind:value={kind}>
						<option value="gemeinde">Gemeindemitglied</option>
						<option value="pfahl">Pfahlbeamter</option>
					</select>
				</div>
			</div>
			{#if kind === 'pfahl'}
				<div class="field">
					<label for="calling">Berufung</label>
					<input id="calling" name="calling" type="text" list="stakeCallings" value={m.calling ?? ''} placeholder="z.B. Hoherat" autocomplete="off" />
					<datalist id="stakeCallings">{#each data.stakeCallings as c}<option value={c}></option>{/each}</datalist>
				</div>
			{:else}
				<div class="field"><label for="af">Bemerkung (optional, erscheint in Klammern)</label><input id="af" name="affiliation" type="text" value={m.affiliation ?? ''} placeholder="z.B. Missionar" /></div>
			{/if}
			<div class="grid-2">
				<div class="field"><label for="nt">Notiz Ansprache</label><input id="nt" name="noteTalk" type="text" value={m.noteTalk ?? ''} /></div>
				<div class="field"><label for="np">Notiz Gebet</label><input id="np" name="notePrayer" type="text" value={m.notePrayer ?? ''} /></div>
			</div>
			<div class="field">
				<label for="active">Status</label>
				<select id="active" name="active">
					<option value="1" selected={m.active}>aktiv (erscheint in Auswahllisten)</option>
					<option value="0" selected={!m.active}>inaktiv (Kind, weggezogen, Gast ohne weitere Einsätze)</option>
				</select>
			</div>
			<button class="btn btn-primary" type="submit">Speichern</button>
		</form>
	{:else}
		<p><strong>Art:</strong> {m.kind === 'pfahl' ? `Pfahlbeamter${m.calling ? ` (${m.calling})` : ''}` : `Gemeindemitglied${m.affiliation ? ` (${m.affiliation})` : ''}`} · <strong>Status:</strong> {m.active ? 'aktiv' : 'inaktiv'}</p>
		{#if data.stats}
			{#if m.noteTalk}<p><strong>Notiz Ansprache:</strong> {m.noteTalk}</p>{/if}
			{#if m.notePrayer}<p><strong>Notiz Gebet:</strong> {m.notePrayer}</p>{/if}
		{/if}
	{/if}
</div>

{#if data.stats}
	<div class="section">
		<h2>Einsätze</h2>
		{#if data.history.length === 0}
			<p class="muted">Noch keine Ansprachen oder Gebete erfasst.</p>
		{:else}
			<table class="table">
				<thead><tr><th>Datum</th><th>Was</th><th>Thema</th></tr></thead>
				<tbody>
					{#each data.history as h}
						<tr><td><a href="/sonntag/{h.date}">{h.dateLabel}</a></td><td>{h.what}</td><td>{h.topic ?? ''}</td></tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{/if}
