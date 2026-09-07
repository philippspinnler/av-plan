<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<h1>Einstellungen</h1>
{#if form?.error}<div class="error">{form.error}</div>{/if}
{#if form?.saved}<div class="success">Gespeichert.</div>{/if}
<div class="section">
	<form method="POST" use:enhance>
		<div class="field"><label for="ward">Gemeindename</label><input id="ward" name="ward_name" type="text" value={data.settings.ward_name} required /></div>
		<div class="grid-2">
			<div class="field"><label for="start">Beginn der Versammlung</label><input id="start" name="meeting_start_time" type="time" value={data.settings.meeting_start_time} required /></div>
			<div class="field"><label for="talks">Standard-Beginn der Ansprachen</label><input id="talks" name="talks_start_time_default" type="time" value={data.settings.talks_start_time_default} required /></div>
		</div>
		<p class="hint">Der Beginn der Ansprachen kann pro Sonntag überschrieben werden. Daraus werden die Zeitfenster auf dem Zettel berechnet.</p>
		<div class="actions"><a class="btn" href="/admin/export">Datenbank herunterladen (Backup)</a><button class="btn btn-primary" type="submit">Speichern</button></div>
	</form>
</div>
