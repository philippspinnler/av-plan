<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { monthLabel } from '$lib/dates';
	let { data } = $props();
	const link = $derived(data.youthToken ? `${page.url.origin}/j/${data.youthToken}` : '');
	let copied = $state(false);
	async function copy() {
		await navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
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

{#if link}
	<p class="public-link">
		<span class="muted">Jugendseite:</span> <a href={link} rel="noopener noreferrer">{link}</a>
		<button class="btn btn-small" type="button" onclick={copy}>{copied ? 'Kopiert' : 'Link kopieren'}</button>
	</p>
{/if}

{#if data.next.length}
	<div class="next-grid">
		{#each data.next as ev (ev.date)}
			<div class="card big-card" class:has-open={ev.status === 'open'}>
				<div class="section-title">
					<div><span class="kind-tag">{ev.weekdayLabel} · {ev.kindLabel}</span><h2 class="next-date">{ev.dateLabel}</h2></div>
					<a class="btn btn-primary btn-small" href="/jugend/{ev.date}">Bearbeiten</a>
				</div>
				{#if ev.status === 'off'}
					<p>{ev.offLabel}</p>
				{:else if ev.status === 'open'}
					<p class="muted">noch nicht geplant</p>
				{:else}
					{#if ev.weekday === 'sunday' && (ev.topic || ev.topicUrl)}
						<p class="next-topic">{#if ev.topicUrl}<a href={ev.topicUrl} rel="noopener noreferrer">{ev.topic ?? 'Unterlage'}</a>{:else}{ev.topic}{/if}</p>
					{/if}
					<div class="next-parts" class:single={ev.joint}>
						{#each ev.parts as p (p.side)}
							<div>
								{#if p.label}<div class="kind-tag">{p.label}</div>{/if}
								{#if !p.planned}<p class="muted">noch nicht geplant</p>{/if}
								{#if p.text && ev.weekday !== 'sunday'}<p class="next-what">{p.text}</p>{/if}
								{#if p.details}<p class="hint">{p.details}</p>{/if}
								<p class="hint">
									{#if p.leaderName}Leitung: {p.leaderName}<br />{/if}
									{#if p.teacherName}Lehrer: {p.teacherName}{:else if p.thoughtName}Gedanke: {p.thoughtName}{/if}
								</p>
							</div>
						{/each}
					</div>
					{#if ev.snack}<p class="hint">Snack: {ev.snack}</p>{/if}
				{/if}
			</div>
		{/each}
	</div>
{/if}

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
				<colgroup><col class="c-day" /><col class="c-kind" /><col class="c-person" /><col class="c-person" /><col /><col /></colgroup>
				<thead>
					<tr><th class="col-day">Datum</th><th>Typ</th><th>JD</th><th>JM</th><th>Snack</th><th>Hinweis</th></tr>
				</thead>
				<tbody>
					{#each g.items as r}
						<tr class="clickable" class:muted={r.date < data.today} class:no-meeting={r.status === 'off'} onclick={() => goto(`/jugend/${r.date}`)}>
							<td class="col-day td-main td-inline"><a href="/jugend/{r.date}">{r.dateLabel}</a></td>
							<td class="td-inline td-kind">{r.kindLabel}</td>
							{#if r.status === 'off'}
								<td></td><td></td><td></td>
								<td>{r.offLabel ?? ''}</td>
							{:else}
								{#if r.status === 'open'}
									<td colspan="2" class="muted">offen</td>
								{:else}
									<td data-label="JD">{r.jd ?? ''}</td>
									<td data-label="JM">{r.jm ?? ''}</td>
								{/if}
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

<style>
	.public-link { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 0 0 1rem; }
	.public-link a { overflow-wrap: anywhere; }
	.next-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
	.next-grid .card { margin-bottom: 0; }
	.next-date { font-size: 1.25rem; }
	.next-topic { font-weight: 600; margin: 0 0 0.5rem; }
	.next-parts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
	.next-parts.single { grid-template-columns: 1fr; }
	.next-what { font-weight: 600; margin: 0.2rem 0; }
	@media (max-width: 640px) { .next-grid, .next-parts { grid-template-columns: 1fr; } }
</style>
