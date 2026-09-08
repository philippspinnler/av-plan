<script lang="ts">
	import { enhance } from '$app/forms';
	import MemberSelect from '$lib/components/MemberSelect.svelte';
	let { data, form } = $props();
</script>

<h1>Einstellungen</h1>
{#if form?.error}<div class="error">{form.error}</div>{/if}
{#if form?.saved}<div class="success">Gespeichert.</div>{/if}

<div class="section">
	<h2>Bischofschaft</h2>
	<p class="hint">Nur diese Personen können als Leitung eingetragen und bei "Abwesend" angekreuzt werden.</p>
	{#if data.bishopric.length === 0}
		<p class="muted">Noch niemand festgelegt.</p>
	{:else}
		<ul class="row-list">
			{#each data.bishopric as b}
				<li>
					<span style="flex: 1">{b.name}</span>
					<form method="POST" action="?/removeBishop" use:enhance>
						<input type="hidden" name="member" value={b.id} />
						<button class="btn btn-small btn-danger" type="submit">Entfernen</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
	<form method="POST" action="?/addBishop" use:enhance class="actions">
		<div class="field" style="flex: 1; margin: 0; min-width: 16rem">
			<label for="member">Person hinzufügen</label>
			<MemberSelect id="member" name="member" options={data.candidates} />
		</div>
		<button class="btn btn-primary" type="submit">Hinzufügen</button>
	</form>
</div>

<div class="section">
	<h2>Allgemein</h2>
	<form method="POST" action="?/general" use:enhance>
		<div class="field"><label for="ward">Gemeindename</label><input id="ward" name="ward_name" type="text" value={data.settings.ward_name} required /></div>
		<div class="actions"><a class="btn" href="/admin/export">Datenbank herunterladen (Backup)</a><button class="btn btn-primary" type="submit">Speichern</button></div>
	</form>
</div>
