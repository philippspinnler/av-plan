<script lang="ts">
	import { goto } from '$app/navigation';
	let { data } = $props();
	const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	const monthLabel = (date: string) => `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
	const groups = $derived(
		data.rows.reduce<{ label: string; items: typeof data.rows }[]>((acc, r) => {
			const label = monthLabel(r.date);
			const last = acc[acc.length - 1];
			if (last && last.label === label) last.items.push(r);
			else acc.push({ label, items: [r] });
			return acc;
		}, [])
	);
</script>

{#snippet cell(r: (typeof data.rows)[number], v: string | null)}{#if v}{v}{:else if r.status === 'open'}<span class="muted">offen</span>{/if}{/snippet}

<div class="section-title">
	<h2>{data.year ? `Jugend ${data.year}` : 'Kommende Termine'}</h2>
	<div class="actions">
		<a class="btn btn-small" href="/jugend" class:btn-primary={!data.year}>Kommende</a>
		{#each data.years as y}<a class="btn btn-small" href="/jugend?jahr={y}" class:btn-primary={data.year === y}>{y}</a>{/each}
	</div>
</div>
{#if data.rows.length === 0}
	<div class="section"><p class="muted">Keine Termine in diesem Zeitraum.</p></div>
{:else}
	{#each groups as g}
		<h2 class="month-title">{g.label}</h2>
		<div class="section table-wrap">
			<table class="table overview stack">
				<thead>
					<tr><th>Datum</th><th>Art</th><th>JD</th><th>JM</th><th>Snack</th><th>Hinweis</th></tr>
				</thead>
				<tbody>
					{#each g.items as r}
						<tr class="clickable" class:muted={r.date < data.today || r.status === 'off'} onclick={() => goto(`/jugend/${r.date}`)}>
							<td class="td-main td-inline"><a href="/jugend/{r.date}">{r.dateLabel}</a></td>
							<td class="td-inline td-kind"><span class="kind-tag">{r.kindLabel}</span></td>
							{#if r.status === 'off'}
								<td></td><td></td><td></td>
								<td>{r.offLabel ?? ''}</td>
							{:else}
								<td data-label="JD">{@render cell(r, r.jd)}</td>
								<td data-label="JM">{@render cell(r, r.jm)}</td>
								<td data-label={r.snack ? 'Snack' : null}>{r.snack ?? ''}</td>
								<td>{r.hint ?? ''}</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/each}
{/if}
