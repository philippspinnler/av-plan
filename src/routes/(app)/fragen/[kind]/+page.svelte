<script lang="ts">
	import { goto } from '$app/navigation';
	import SortHeader from '$lib/components/SortHeader.svelte';
	import { DEFAULT_ASK_SORT, sortAskRows, type AskSortState } from '$lib/ask-sort';
	let { data } = $props();
	let sort = $state<AskSortState>(DEFAULT_ASK_SORT);
	const rows = $derived(sortAskRows(data.rows, sort));
	const onsort = (s: AskSortState) => (sort = s);
</script>

<p class="hint">Zuoberst steht, wer am längsten nicht dran war. Eingeplante stehen grau am Ende. {data.hint}</p>

<div class="section table-wrap">
	<table class="table stack">
		<thead>
			<tr>
				<SortHeader key="name" label="Name" {sort} {onsort} />
				<SortHeader key="last" label={data.column} {sort} {onsort} />
				<SortHeader key="note" label="Notiz" {sort} {onsort} />
			</tr>
		</thead>
		<tbody>
			{#each rows as r (r.id)}
				<tr class="clickable" onclick={() => goto(`/mitglieder/${r.id}`)}>
					<td class="td-main"><a href="/mitglieder/{r.id}">{r.name}</a></td>
					<td class:muted={r.planned} data-label={data.column}>{r.label}</td>
					<td class="hint" data-label={r.note ? 'Notiz' : null}>{r.note}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
