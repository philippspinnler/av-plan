<script lang="ts">
	import { goto } from '$app/navigation';
	let { data, form } = $props();
	let showForm = $state(false);
</script>

<div class="section-title">
	<h1>Personen</h1>
	<div class="actions">
		<a class="btn" href={data.showAll ? '/mitglieder' : '/mitglieder?alle=1'}>{data.showAll ? 'Nur aktive' : 'Alle anzeigen'}</a>
		{#if data.canCreate}<button class="btn btn-primary" type="button" onclick={() => (showForm = !showForm)}>Person hinzufügen</button>{/if}
	</div>
</div>

{#if form?.error}<div class="error">{form.error}</div>{/if}

{#if showForm}
	<div class="section">
		<form method="POST" action="?/create" class="grid-3">
			<div class="field"><label for="fn">Vorname</label><input id="fn" name="firstName" type="text" required /></div>
			<div class="field"><label for="ln">Nachname</label><input id="ln" name="lastName" type="text" /></div>
			<div class="field"><label for="af">Zugehörigkeit (leer für Gemeindemitglied)</label><input id="af" name="affiliation" type="text" placeholder="z.B. Hoherat" /></div>
			<div class="actions"><button class="btn btn-primary" type="submit">Anlegen</button></div>
		</form>
	</div>
{/if}

<div class="section table-wrap">
	<table class="table">
		<thead>
			<tr>
				<th>Name</th>
				{#if data.stats}<th>Letzte Ansprache</th><th>Letztes Gebet</th><th>Notizen</th>{/if}
				{#if data.showAll}<th>Status</th>{/if}
			</tr>
		</thead>
		<tbody>
			{#each data.members as m}
				<tr class="clickable" onclick={() => goto(`/mitglieder/${m.id}`)}>
					<td><a href="/mitglieder/{m.id}">{m.name}</a></td>
					{#if data.stats}
						<td>{m.lastTalk}</td>
						<td>{m.lastPrayer}</td>
						<td class="hint">{[m.noteTalk, m.notePrayer].filter(Boolean).join(' · ')}</td>
					{/if}
					{#if data.showAll}<td>{m.active ? 'aktiv' : 'inaktiv'}</td>{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
