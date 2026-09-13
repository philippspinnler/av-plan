<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	let { data } = $props();
	const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
	const monthLabel = (date: string) => `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
	const dayLabel = (date: string) => `${Number(date.slice(8, 10))}.`;
	/** Offene Punkte der Box, jeder mit Link auf den Reiter, in dem man ihn erledigt. */
	const tabFor = (item: string) =>
		item === 'Leitung' ? 'allgemein' : item.endsWith('gebet') ? 'gebete' : item.startsWith('Ansprachen') ? 'ansprachen' : 'musik';
	const openItems = $derived.by(() => {
		if (!data.next || !data.next.rated) return [];
		const items: string[] = [];
		if (data.prayersOnly) items.push(...(data.next.prayers.opening ? [] : ['Anfangsgebet']), ...(data.next.prayers.closing ? [] : ['Schlussgebet']));
		else {
			if (data.showProgram) items.push(...data.next.missingProgram);
			if (data.showHymns) items.push(...data.next.missingMusic);
		}
		return items.map((label) => ({ label, href: `/sonntag/${data.next!.date}?tab=${tabFor(label)}` }));
	});
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

{#snippet value(v: string | null)}{#if v}{v}{:else}<span class="muted">offen</span>{/if}{/snippet}

{#if data.next && data.nav && !data.year}
	<div class="section-title">
		<h1>{data.nextTitle}</h1>
		<div class="actions sunday-nav">
			{#if data.nav.prev}<a class="btn btn-small" href="/?datum={data.nav.prev}" aria-label="Vorheriger Sonntag">‹</a>{:else}<span class="btn btn-small" aria-disabled="true">‹</span>{/if}
			<a class="btn btn-small" href="/" class:btn-primary={data.nav.isUpcoming}>Bevorstehend</a>
			{#if data.nav.next}<a class="btn btn-small" href="/?datum={data.nav.next}" aria-label="Nächster Sonntag">›</a>{:else}<span class="btn btn-small" aria-disabled="true">›</span>{/if}
		</div>
	</div>
	<div class="card big-card" class:has-open={openItems.length > 0}>
		{#if openItems.length}
			<div class="todo-strip">
				<strong>Noch offen:</strong>
				{#each openItems as o, i (o.label)}{#if i > 0}<span class="muted"> · </span>{/if}<a href={o.href}>{o.label}</a>{/each}
			</div>
		{:else if data.next.rated}
			<div class="ready-strip">Alles bereit</div>
		{/if}
		<div class="section-title">
			<span class="kind-tag">{data.next.kindLabel}</span>
			<div class="actions">
				<a class="btn btn-primary btn-icon" href="/sonntag/{data.next.date}" aria-label="Bearbeiten" title="Bearbeiten"><Icon name="edit" /><span>Bearbeiten</span></a>
				{#if data.showProgram && data.next.hasProgram}
					<a class="btn btn-icon" href="/sonntag/{data.next.date}/druck?vollbild=1" aria-label="Vollbild" title="Vollbild"><Icon name="expand" /><span>Vollbild</span></a>
					<a class="btn btn-icon" href="/sonntag/{data.next.date}/druck" aria-label="Drucken" title="Drucken"><Icon name="print" /><span>Drucken</span></a>
				{/if}
			</div>
		</div>
		{#if !data.next.hasProgram}
			<p class="muted">Kein Programm an diesem Sonntag.</p>
		{:else if data.prayersOnly}
			<p><strong>Anfangsgebet:</strong> {@render value(data.next.prayers.opening)}</p>
			<p><strong>Schlussgebet:</strong> {@render value(data.next.prayers.closing)}</p>
		{:else}
			{#if data.next.theme}<p><strong>Thema:</strong> {data.next.theme}</p>{/if}
			{#if data.showProgram}
				<p><strong>Leitung:</strong> {@render value(data.next.presiding)}</p>
				<p><strong>Gebete:</strong> {@render value(data.next.prayers.opening)} · {@render value(data.next.prayers.closing)}</p>
				<p><strong>Sprecher:</strong> {@render value(data.next.speakers.length ? data.next.speakers.join(', ') : null)}</p>
			{/if}
			<p><strong>Lieder:</strong> {@render value(data.next.hymns.length ? data.next.hymns.join(' · ') : null)}</p>
			{#if data.showHymns}
				<p><strong>Orgel / Klavier:</strong> {@render value(data.next.organist)} · <strong>Dirigieren:</strong> {@render value(data.next.conductor)}</p>
			{/if}
		{/if}
	</div>
{/if}

<div class="section-title">
	<h1>{data.year ? `Alle Sonntage ${data.year}` : 'Kommende Sonntage'}</h1>
	<div class="actions">
		<a class="btn btn-small" href="/" class:btn-primary={!data.year}>Kommende</a>
		{#each data.years as y}<a class="btn btn-small" href="/?jahr={y}" class:btn-primary={data.year === y}>{y}</a>{/each}
	</div>
</div>
{#if data.meetings.length === 0}
	<div class="section"><p class="muted">Keine Sonntage in diesem Zeitraum. Ein Admin kann sie unter Einstellungen anlegen.</p></div>
{:else}
	{#each groups as g}
		<h2 class="month-title">{g.label}</h2>
		<div class="section table-wrap">
			<table class="table overview stack">
				<colgroup>
					<col class="c-day" />
					<col class="c-kind" />
					{#if data.prayersOnly}
						<col />
						<col />
					{:else}
						<col class="c-theme" />
						{#if data.showProgram}<col class="c-person" /><col class="c-status" />{/if}
						{#if data.musicColumns}<col class="c-person" /><col class="c-person" />{/if}
						<col class="c-status" />
					{/if}
				</colgroup>
				<thead>
					<tr>
						<th class="col-day">Datum</th><th>Typ</th>
						{#if data.prayersOnly}<th>Anfangsgebet</th><th>Schlussgebet</th>{:else}<th>Thema</th>{#if data.showProgram}<th>Leitung</th><th>Programm</th>{/if}{#if data.musicColumns}<th>Orgel / Klavier</th><th>Dirigieren</th>{/if}<th>Musik</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each g.items as m}
						<tr class="clickable" class:muted={m.date < data.today} class:no-meeting={!m.hasProgram} onclick={() => goto(`/sonntag/${m.date}`)}>
							<td class="col-day td-main td-inline"><a href="/sonntag/{m.date}">{dayLabel(m.date)}</a></td>
							<td class="td-inline td-kind">{m.kind === 'normal' ? '' : m.kindLabel}</td>
							{#if data.prayersOnly}
								<td data-label="Anfangsgebet">{#if m.prayers.opening}{m.prayers.opening}{:else if m.rated}<span class="badge badge-offen">offen</span>{/if}</td>
								<td data-label="Schlussgebet">{#if m.prayers.closing}{m.prayers.closing}{:else if m.rated}<span class="badge badge-offen">offen</span>{/if}</td>
							{:else}
							<td>{m.theme ?? ''}</td>
							{#if data.showProgram}
								<td data-label={m.presiding ? 'Leitung' : null}>{m.presiding ?? ''}</td>
								<td data-label={m.rated ? 'Programm' : null}>
									{#if m.rated}
										{#if m.missingProgram.length}<span class="badge badge-offen">{m.missingProgram.join(', ')}</span>{:else}<span class="badge badge-zugesagt">bereit</span>{/if}
									{/if}
								</td>
							{/if}
							{#if data.musicColumns}
								<td data-label={m.organist ? 'Orgel / Klavier' : null}>{m.organist ?? ''}</td>
								<td data-label={m.conductor ? 'Dirigieren' : null}>{m.conductor ?? ''}</td>
							{/if}
							<td data-label={m.rated ? 'Musik' : null}>
								{#if m.rated}
									{#if m.missingMusic.length}<span class="badge badge-offen">{m.missingMusic.join(', ')}</span>{:else}<span class="badge badge-zugesagt">bereit</span>{/if}
								{/if}
							</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/each}
{/if}
