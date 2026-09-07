<script lang="ts">
	let { data, form } = $props();
	let q = $state('');
	let showForm = $state(false);
	const filtered = $derived(
		data.hymns.filter((h) => !q || String(h.number).startsWith(q.trim()) || h.title.toLowerCase().includes(q.trim().toLowerCase()))
	);
</script>

<div class="section-title">
	<h1>Lieder</h1>
	{#if data.canEdit}<button class="btn btn-primary" type="button" onclick={() => (showForm = !showForm)}>Lied hinzufügen</button>{/if}
</div>
{#if form?.error}<div class="error">{form.error}</div>{/if}

{#if showForm}
	<div class="section">
		<form method="POST" action="?/create" class="grid-3">
			<div class="field"><label for="nr">Nummer</label><input id="nr" name="number" type="number" min="1" required /></div>
			<div class="field"><label for="ti">Titel</label><input id="ti" name="title" type="text" required /></div>
			<div class="field"><label for="du">Dauer (m:ss, optional)</label><input id="du" name="duration" type="text" placeholder="3:45" /></div>
			<div class="actions"><button class="btn btn-primary" type="submit">Anlegen</button></div>
		</form>
		<p class="hint">Nummern ab 1001 gehören zum neuen Liederbuch.</p>
	</div>
{/if}

<div class="section">
	<div class="field"><label for="q">Suchen (Nummer oder Titel)</label><input id="q" type="text" bind:value={q} placeholder="z.B. 56 oder Felsen" /></div>
	<div class="table-wrap">
		<table class="table">
			<thead><tr><th>Nr.</th><th>Titel</th><th>Buch</th><th>Dauer</th><th>Zuletzt</th><th>Letzte 52 Wochen</th></tr></thead>
			<tbody>
				{#each filtered as h}
					<tr>
						<td><a href="/lieder/{h.number}">{h.number}</a></td>
						<td><a href="/lieder/{h.number}">{h.title}</a></td>
						<td class="muted">{h.book}</td>
						<td>{h.duration}</td>
						<td>{h.lastSung}</td>
						<td>{h.count52}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
