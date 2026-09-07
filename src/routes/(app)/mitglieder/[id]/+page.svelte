<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	const m = $derived(data.member);
</script>

<p><a href="/mitglieder">← Personen</a></p>
<h1>{data.title}</h1>
{#if form?.error}<div class="error">{form.error}</div>{/if}
{#if form?.saved}<div class="success">Gespeichert.</div>{/if}

<div class="section">
	{#if data.canEdit}
		<form method="POST" action="?/update" use:enhance>
			<div class="grid-3">
				<div class="field"><label for="fn">Vorname</label><input id="fn" name="firstName" type="text" required value={m.firstName} /></div>
				<div class="field"><label for="ln">Nachname</label><input id="ln" name="lastName" type="text" value={m.lastName} /></div>
				<div class="field"><label for="af">Zugehörigkeit</label><input id="af" name="affiliation" type="text" value={m.affiliation ?? ''} placeholder="leer für Gemeindemitglied" /></div>
			</div>
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
		<p><strong>Zugehörigkeit:</strong> {m.affiliation ?? 'Gemeindemitglied'} · <strong>Status:</strong> {m.active ? 'aktiv' : 'inaktiv'}</p>
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
