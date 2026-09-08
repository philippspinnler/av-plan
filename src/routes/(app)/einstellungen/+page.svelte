<script lang="ts">
	import { enhance } from '$app/forms';
	import MemberSelect from '$lib/components/MemberSelect.svelte';
	let { data, form } = $props();
</script>

<h1>Einstellungen</h1>
{#if form?.error}<div class="error">{form.error}</div>{/if}
{#if form?.saved}<div class="success">Gespeichert.</div>{/if}
{#if form?.created !== undefined}<div class="success">{form.created} neue Sonntage angelegt.</div>{/if}

<div class="section">
	<h2>Sonntage</h2>
	<p class="hint">Legt alle noch fehlenden Sonntage der nächsten 12 Monate an. Bestehende Sonntage bleiben unverändert.</p>
	<form method="POST" action="?/ensureSundays" use:enhance>
		<button class="btn btn-primary" type="submit">Sonntage für 12 Monate anlegen</button>
	</form>
</div>

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
			<label for="member">Mitglied hinzufügen</label>
			<MemberSelect id="member" name="member" options={data.candidates} />
		</div>
		<button class="btn btn-primary" type="submit">Hinzufügen</button>
	</form>
</div>

<div class="section">
	<h2>Berufungen der Pfahlbeamten</h2>
	<p class="hint">Diese Liste steht bei Pfahlbeamten zur Auswahl. Der Name erscheint in Klammern hinter der Person.</p>
	<ul class="row-list">
		{#each data.callings as c, i}
			<li>
				<form method="POST" action="?/renameCalling" use:enhance class="actions" style="flex: 1; margin: 0">
					<input type="hidden" name="id" value={c.id} />
					<input type="text" name="name" value={c.name} required style="flex: 1" />
					<button class="btn btn-small" type="submit">Umbenennen</button>
				</form>
				<form method="POST" action="?/moveCalling" use:enhance>
					<input type="hidden" name="id" value={c.id} />
					<button class="btn btn-small" type="submit" name="dir" value="up" disabled={i === 0} aria-label="nach oben">↑</button>
					<button class="btn btn-small" type="submit" name="dir" value="down" disabled={i === data.callings.length - 1} aria-label="nach unten">↓</button>
				</form>
				<form method="POST" action="?/deleteCalling" use:enhance>
					<input type="hidden" name="id" value={c.id} />
					<button class="btn btn-small btn-danger" type="submit">Löschen</button>
				</form>
			</li>
		{/each}
	</ul>
	<form method="POST" action="?/addCalling" use:enhance class="actions">
		<div class="field" style="flex: 1; margin: 0; min-width: 16rem">
			<label for="newCalling">Neue Berufung</label>
			<input id="newCalling" name="name" type="text" placeholder="z.B. Tempelpräsident" required />
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
