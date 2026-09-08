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
		<div class="actions"><a class="btn" href="/admin/export">Datenbank herunterladen (Backup)</a><button class="btn btn-primary" type="submit">Speichern</button></div>
	</form>
</div>
