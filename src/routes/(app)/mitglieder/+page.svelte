<script lang="ts">
	import { goto } from '$app/navigation';
	let { data, form } = $props();
	let showForm = $state(false);
	let newKind = $state<'gemeinde' | 'pfahl'>('gemeinde');
</script>

{#snippet memberTable(rows: typeof data.ward, withStats: boolean)}
	<div class="table-wrap">
		<table class="table">
			<thead>
				<tr>
					<th>Name</th>
					{#if withStats}<th>Letzte Ansprache</th><th>Letztes Gebet</th><th>Notizen</th>{/if}
					{#if data.showAll}<th>Status</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each rows as m}
					<tr class="clickable" onclick={() => goto(`/mitglieder/${m.id}`)}>
						<td><a href="/mitglieder/{m.id}">{m.name}</a></td>
						{#if withStats}
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
{/snippet}

<div class="section-title">
	<h1>Mitglieder</h1>
	<div class="actions">
		<a class="btn" href={data.showAll ? '/mitglieder' : '/mitglieder?alle=1'}>{data.showAll ? 'Nur aktive' : 'Alle anzeigen'}</a>
		{#if data.canCreate}<button class="btn btn-primary" type="button" onclick={() => (showForm = !showForm)}>Mitglied hinzufügen</button>{/if}
	</div>
</div>

{#if form?.error}<div class="error">{form.error}</div>{/if}

{#if showForm}
	<div class="section">
		<form method="POST" action="?/create">
			<div class="grid-3">
				<div class="field"><label for="fn">Vorname</label><input id="fn" name="firstName" type="text" required /></div>
				<div class="field"><label for="ln">Nachname</label><input id="ln" name="lastName" type="text" /></div>
				<div class="field">
					<label for="kind">Art</label>
					<select id="kind" name="kind" bind:value={newKind}>
						<option value="gemeinde">Gemeindemitglied</option>
						<option value="pfahl">Pfahlbeamter</option>
					</select>
				</div>
			</div>
			{#if newKind === 'pfahl'}
				<div class="field">
					<label for="calling">Berufung</label>
					<input id="calling" name="calling" type="text" list="stakeCallings" placeholder="z.B. Hoherat" autocomplete="off" />
					<datalist id="stakeCallings">{#each data.stakeCallings as c}<option value={c}></option>{/each}</datalist>
				</div>
			{:else}
				<div class="field"><label for="af">Bemerkung (optional, erscheint in Klammern)</label><input id="af" name="affiliation" type="text" placeholder="z.B. Missionar" /></div>
			{/if}
			<div class="actions"><button class="btn btn-primary" type="submit">Anlegen</button></div>
		</form>
	</div>
{/if}

<div class="section">
	<h2>Gemeindemitglieder</h2>
	{#if data.ward.length === 0}<p class="muted">Keine Einträge.</p>{:else}{@render memberTable(data.ward, data.stats)}{/if}
</div>

<div class="section">
	<h2>Pfahlbeamte</h2>
	<p class="hint">Erscheinen nur bei den Ansprachen zur Auswahl.</p>
	{#if data.stake.length === 0}<p class="muted">Keine Einträge.</p>{:else}{@render memberTable(data.stake, false)}{/if}
</div>
