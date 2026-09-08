<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	let { data, form } = $props();
	const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	const monthLabel = (date: string) => `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
	const dayLabel = (date: string) => `${Number(date.slice(8, 10))}.`;
	const groups = $derived(
		data.meetings.reduce<{ label: string; items: typeof data.meetings }[]>((acc, m) => {
			const label = monthLabel(m.date);
			const last = acc[acc.length - 1];
			if (last && last.label === label) last.items.push(m);
			else acc.push({ label, items: [m] });
			return acc;
		}, [])
	);
</script>

<div class="section-title">
	<h1>Sonntage</h1>
	<div class="actions">
		{#if data.canCreate}
			<form method="POST" action="?/ensure" use:enhance><button class="btn" type="submit">Sonntage für 12 Monate anlegen</button></form>
		{/if}
	</div>
</div>
{#if form?.created !== undefined}<div class="success">{form.created} neue Sonntage angelegt.</div>{/if}

{#if data.next && !data.year}
	<div class="card big-card">
		<div class="section-title">
			<div>
				<span class="kind-tag">Nächster Sonntag · {data.next.kindLabel}</span>
				<h2>{data.next.dateLabel}</h2>
			</div>
			<div class="actions">
				<a class="btn btn-primary" href="/sonntag/{data.next.date}">Bearbeiten</a>
				{#if data.showProgram}<a class="btn" href="/sonntag/{data.next.date}/druck">Drucken</a>{/if}
			</div>
		</div>
		{#if data.next.theme}<p><strong>Thema:</strong> {data.next.theme}</p>{/if}
		{#if data.showProgram}
			<p><strong>Leitung:</strong> {data.next.presiding ?? '–'}</p>
			<p><strong>Sprecher:</strong> {data.next.speakers.length ? data.next.speakers.join(', ') : '–'}</p>
		{/if}
		<p><strong>Lieder:</strong> {data.next.hymns.length ? data.next.hymns.join(' · ') : '–'}</p>
		{#if data.next.rated}
			<div class="status-row">
				{#if data.showProgram}
					<div><span class="status-label">Programm</span>
						{#if data.next.missingProgram.length}<span class="badge badge-offen">{data.next.missingProgram.join(', ')}</span>{:else}<span class="badge badge-zugesagt">bereit</span>{/if}
					</div>
				{/if}
				<div><span class="status-label">Musik</span>
					{#if data.next.missingMusic.length}<span class="badge badge-offen">{data.next.missingMusic.join(', ')}</span>{:else}<span class="badge badge-zugesagt">bereit</span>{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

<div class="section">
	<div class="section-title">
		<h2>{data.year ? `Alle Sonntage ${data.year}` : 'Kommende Sonntage'}</h2>
		<div class="actions">
			<a class="btn btn-small" href="/" class:btn-primary={!data.year}>Kommende</a>
			{#each data.years as y}<a class="btn btn-small" href="/?jahr={y}" class:btn-primary={data.year === y}>{y}</a>{/each}
		</div>
	</div>
	{#if data.meetings.length === 0}
		<p class="muted">Keine Sonntage in diesem Zeitraum. {#if data.canCreate}Lege sie mit der Schaltfläche oben an.{/if}</p>
	{:else}
		{#each groups as g}
		<h3 class="month-title">{g.label}</h3>
		<div class="table-wrap">
			<table class="table overview">
				<colgroup>
					<col class="c-day" />
					<col class="c-kind" />
					<col class="c-theme" />
					{#if data.showProgram}<col class="c-status" />{/if}
					<col class="c-status" />
				</colgroup>
				<thead><tr><th class="col-day">Datum</th><th>Typ</th><th>Thema</th>{#if data.showProgram}<th>Programm</th>{/if}<th>Musik</th></tr></thead>
				<tbody>
					{#each g.items as m}
						<tr class="clickable" class:muted={m.date < data.today} onclick={() => goto(`/sonntag/${m.date}`)}>
							<td class="col-day"><a href="/sonntag/{m.date}">{dayLabel(m.date)}</a></td>
							<td>{m.kind === 'normal' ? '' : m.kindLabel}</td>
							<td>{m.theme ?? ''}</td>
							{#if data.showProgram}
								<td>
									{#if m.rated}
										{#if m.missingProgram.length}<span class="badge badge-offen">{m.missingProgram.join(', ')}</span>{:else}<span class="badge badge-zugesagt">bereit</span>{/if}
									{/if}
								</td>
							{/if}
							<td>
								{#if m.rated}
									{#if m.missingMusic.length}<span class="badge badge-offen">{m.missingMusic.join(', ')}</span>{:else}<span class="badge badge-zugesagt">bereit</span>{/if}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{/each}
	{/if}
</div>
