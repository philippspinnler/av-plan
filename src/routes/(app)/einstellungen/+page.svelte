<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	function submitOnChange(e: Event) {
		(e.currentTarget as HTMLInputElement | HTMLSelectElement).form?.requestSubmit();
	}
</script>

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
	<p class="hint">Leitung und Abwesenheiten beziehen sich auf diese drei Personen. Vorsitz: Bischof, sonst 1., sonst 2. Ratgeber.</p>
	<div class="grid-3">
		{#each data.bishopric as b (b.role)}
			<form method="POST" action="?/bishopRole" use:enhance class="field">
				<input type="hidden" name="role" value={b.role} />
				<label for="role-{b.role}">{b.label}</label>
				<select id="role-{b.role}" name="member" onchange={submitOnChange}>
					<option value="">– niemand –</option>
					{#each data.candidates as c}<option value={c.id} selected={c.id === b.memberId}>{c.label}</option>{/each}
				</select>
			</form>
		{/each}
	</div>
</div>

<div class="section">
	<h2>Berufungen der Pfahlbeamten</h2>
	<p class="hint">Berufungen für Pfahlbeamte, angezeigt in Klammern hinter dem Namen. Gäste mit Häkchen "Vorsitz" übernehmen den Vorsitz.</p>
	<ul class="row-list">
		{#each data.callings as c, i}
			<li>
				<form method="POST" action="?/renameCalling" use:enhance class="actions" style="flex: 1; margin: 0">
					<input type="hidden" name="id" value={c.id} />
					<input type="text" name="name" value={c.name} required style="flex: 1" />
					<button class="btn btn-small" type="submit">Umbenennen</button>
				</form>
				<form method="POST" action="?/presidesCalling" use:enhance>
					<input type="hidden" name="id" value={c.id} />
					<label class="check"><input type="checkbox" name="presides" value="1" checked={c.presides} onchange={submitOnChange} /> Vorsitz</label>
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
