<script lang="ts">
	import { enhance } from '$app/forms';
	import MemberSelect from '$lib/components/MemberSelect.svelte';
	let { data, form } = $props();
	let newSide = $state<'jd' | 'jm'>('jd');
	const submitOnChange = (e: Event) => (e.currentTarget as HTMLFormElement).requestSubmit();
</script>

{#if form?.error}<div class="error">{form.error}</div>{/if}
{#if form?.saved}<div class="success">Gespeichert.</div>{/if}

<div class="section">
	<h2>Jugendliche</h2>
	<table>
		<thead><tr><th>Name</th><th>Seite</th><th>Gruppe</th><th></th></tr></thead>
		<tbody>
			{#each data.youth as y (y.memberId)}
				<tr>
					<td>{y.name}</td>
					<td colspan="2">
						<form method="POST" action="?/set" use:enhance onchange={submitOnChange} class="actions" style="margin: 0">
							<input type="hidden" name="memberId" value={y.memberId} />
							<select name="side" aria-label="Seite">
								<option value="jd" selected={y.side === 'jd'}>JD</option>
								<option value="jm" selected={y.side === 'jm'}>JM</option>
							</select>
							<select name="group" aria-label="Gruppe">
								<option value="" selected={y.group === null}>–</option>
								{#each data.groups[y.side] as g}<option value={g.id} selected={y.group === g.id}>{g.label}</option>{/each}
							</select>
						</form>
					</td>
					<td>
						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="memberId" value={y.memberId} />
							<button class="btn btn-small" type="submit">entfernen</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
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
