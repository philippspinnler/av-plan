<script lang="ts">
	import { goto } from '$app/navigation';
	let { data, form } = $props();
	let showForm = $state(false);
</script>

<div class="section-title">
	<h2>Pfahlbeamte</h2>
	<div class="actions">
		<a class="btn" href={data.showAll ? '/einstellungen/pfahlbeamte' : '/einstellungen/pfahlbeamte?alle=1'}>{data.showAll ? 'Nur aktive' : 'Alle anzeigen'}</a>
		{#if data.canCreate}<button class="btn btn-primary" type="button" onclick={() => (showForm = !showForm)}>Pfahlbeamten hinzufügen</button>{/if}
	</div>
</div>
<p class="hint">Pfahlbeamte stehen nur bei den Ansprachen zur Auswahl.</p>

{#if form?.error}<div class="error">{form.error}</div>{/if}

{#if showForm}
	<div class="section">
		<form method="POST" action="?/create" class="grid-3">
			<div class="field"><label for="fn">Vorname</label><input id="fn" name="firstName" type="text" required /></div>
			<div class="field"><label for="ln">Nachname</label><input id="ln" name="lastName" type="text" /></div>
			<div class="field">
				<label for="calling">Berufung</label>
				<select id="calling" name="stakeCallingId">
					<option value="">– keine –</option>
					{#each data.callings as c}<option value={c.id}>{c.name}</option>{/each}
				</select>
			</div>
			<div class="actions"><button class="btn btn-primary" type="submit">Anlegen</button></div>
		</form>
	</div>
{/if}

<div class="section table-wrap">
	<table class="table stack">
		<thead><tr><th>Name</th><th>Berufung</th>{#if data.showAll}<th>Status</th>{/if}</tr></thead>
		<tbody>
			{#each data.officers as o}
				<tr class="clickable" onclick={() => goto(`/mitglieder/${o.id}`)}>
					<td class="td-main"><a href="/mitglieder/{o.id}">{o.name}</a></td>
					<td data-label={o.calling ? 'Berufung' : null}>{o.calling}</td>
					{#if data.showAll}<td data-label="Status">{o.active ? 'aktiv' : 'inaktiv'}</td>{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
