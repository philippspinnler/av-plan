<script lang="ts">
	import { enhance } from '$app/forms';
	import MemberSelect from '$lib/components/MemberSelect.svelte';
	let { data, form } = $props();
	let newSide = $state<'jd' | 'jm'>('jd');
	const submitOnChange = (e: Event) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit();
</script>

{#if form?.error}<div class="error">{form.error}</div>{/if}
{#if form?.saved}<div class="success">Gespeichert.</div>{/if}

<div class="section">
	<h2>Jugendliche</h2>
	<!-- Forms live outside the table; the row's fields attach via form="…". -->
	{#each data.youth as y (y.memberId)}
		<form id="set-{y.memberId}" method="POST" action="?/set" use:enhance><input type="hidden" name="memberId" value={y.memberId} /></form>
		<form id="remove-{y.memberId}" method="POST" action="?/remove" use:enhance><input type="hidden" name="memberId" value={y.memberId} /></form>
	{/each}
	<div class="table-wrap">
		<table class="table stack youth-table">
			<thead><tr><th>Name</th><th>Seite</th><th>Gruppe</th><th></th></tr></thead>
			<tbody>
				{#each data.youth as y (y.memberId)}
					<tr>
						<td class="td-main">{y.name}</td>
						<td data-label="Seite">
							<select name="side" aria-label="Seite" form="set-{y.memberId}" onchange={submitOnChange}>
								<option value="jd" selected={y.side === 'jd'}>JD</option>
								<option value="jm" selected={y.side === 'jm'}>JM</option>
							</select>
						</td>
						<td data-label="Gruppe">
							<select name="group" aria-label="Gruppe" form="set-{y.memberId}" onchange={submitOnChange}>
								<option value="" selected={y.group === null}>–</option>
								{#each data.groups[y.side] as g}<option value={g.id} selected={y.group === g.id}>{g.label}</option>{/each}
							</select>
						</td>
						<td class="td-actions"><button class="btn btn-small" type="submit" form="remove-{y.memberId}">entfernen</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<div class="section">
	<h2>Hinzufügen</h2>
	<form method="POST" action="?/set" use:enhance class="actions">
		<div class="field" style="flex: 1; margin: 0; min-width: 16rem">
			<label for="new-member">Name</label>
			<MemberSelect id="new-member" name="memberId" options={data.candidates} />
		</div>
		<div class="field" style="margin: 0">
			<label for="new-side">Seite</label>
			<select id="new-side" name="side" bind:value={newSide}>
				<option value="jd">JD</option>
				<option value="jm">JM</option>
			</select>
		</div>
		<div class="field" style="margin: 0">
			<label for="new-group">Gruppe</label>
			<select id="new-group" name="group">
				<option value="">–</option>
				{#each data.groups[newSide] as g}<option value={g.id}>{g.label}</option>{/each}
			</select>
		</div>
		<button class="btn btn-primary" type="submit">Hinzufügen</button>
	</form>
</div>

<style>
	.youth-table select { min-width: 9rem; }
	.youth-table .td-actions { text-align: right; }
</style>
