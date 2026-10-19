<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import SortHeader from '$lib/components/SortHeader.svelte';
	import { DEFAULT_ASK_SORT, sortAskRows, type AskSortState } from '$lib/ask-sort';
	let { data } = $props();
	let sort = $state<AskSortState>(DEFAULT_ASK_SORT);
	const rows = $derived(sortAskRows(data.rows, sort));
	const onsort = (s: AskSortState) => (sort = s);
	/** Zeile, deren Notiz gerade bearbeitet wird. */
	let editing = $state<number | null>(null);
	const focus = (el: HTMLInputElement) => el.focus();
</script>

<p class="hint">Zuoberst steht, wer am längsten nicht dran war. Eingeplante stehen grau am Ende. {data.hint}{#if data.canNote} Notizen lassen sich direkt in der Liste bearbeiten.{/if}</p>

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
					{#if data.canNote}
						<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
						<td class="hint note-cell" data-label="Notiz" onclick={(e) => e.stopPropagation()}>
							{#if editing === r.id}
								<form method="POST" action="?/note" class="note-form" use:enhance={() => async ({ update }) => { editing = null; await update(); }}>
									<input type="hidden" name="id" value={r.id} />
									<input name="note" type="text" value={r.note} maxlength="200" use:focus onkeydown={(e) => { if (e.key === 'Escape') editing = null; }} />
									<button class="btn btn-small btn-primary" type="submit">Speichern</button>
								</form>
							{:else}
								<button type="button" class="note-btn" onclick={() => (editing = r.id)} title="Notiz bearbeiten">{r.note || '＋ Notiz'}</button>
							{/if}
						</td>
					{:else}
						<td class="hint" data-label={r.note ? 'Notiz' : null}>{r.note}</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.note-btn { background: none; border: 0; padding: 0; font: inherit; color: inherit; text-align: left; cursor: text; min-height: 1.5rem; width: 100%; }
	.note-btn:empty, .note-btn:hover { text-decoration: underline dotted; }
	.note-form { display: flex; gap: 0.4rem; align-items: center; }
	.note-form input { flex: 1; min-width: 8rem; }
</style>
