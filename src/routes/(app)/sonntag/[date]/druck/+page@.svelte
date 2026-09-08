<script lang="ts">
	let { data } = $props();
	const T = $derived(data.texts);
</script>

<svelte:head><title>Leitungszettel {data.dateLabel}</title></svelte:head>

<div class="toolbar no-print">
	<a class="btn" href="/sonntag/{data.date}">← Zurück</a>
	<button class="btn btn-primary" type="button" onclick={() => window.print()}>Drucken</button>
</div>

<article class="sheet">
	<header class="head">
		<div><span class="lbl">Datum:</span> <strong>{data.dateLabel}</strong></div>
		<div><span class="lbl">Leitung:</span> <strong>{data.presiding || '________'}</strong></div>
	</header>
	{#if data.theme || data.specialNote}
		<p class="theme">{#if data.theme}<strong>Thema:</strong> {data.theme}{/if}{#if data.specialNote} <em>({data.specialNote})</em>{/if}</p>
	{/if}

	{#if !data.hasProgram}
		<p class="big">{data.kindLabel}: kein Leitungszettel nötig.</p>
	{:else}
		<section>
			<h2>Begrüssungsworte</h2>
			{#each T.greetingItems as g}<div class="row"><span class="box">□</span><span>{g}</span></div>{/each}
		</section>

		<section>
			<h2>Bekanntmachungen</h2>
			{#if data.announcements.length === 0}<div class="row muted">keine</div>{/if}
			{#each data.announcements as a}<div class="row"><span class="box">□</span><span>{a}</span></div>{/each}
		</section>

		<section>
			<div class="row"><span class="k">Anfangslied</span><span>{data.hymns.anfang}</span></div>
			<div class="row"><span class="k">Anfangsgebet</span><span>{data.prayers.opening}</span></div>
		</section>

		{#if data.releases.length}
			<section class="boxed">
				<p class="intro">{T.releaseIntro}</p>
				<ul>{#each data.releases as r}<li><strong>{r.personName}</strong>{#if r.calling} – {r.calling}{/if}</li>{/each}</ul>
				<p class="intro">{T.releaseVote}</p>
			</section>
		{/if}
		{#if data.sustainings.length}
			<section class="boxed">
				<p class="intro">{T.sustainIntro}</p>
				<ul>{#each data.sustainings as s}<li><strong>{s.personName}</strong>{#if s.calling} – {s.calling}{/if}</li>{/each}</ul>
				<p class="intro">{T.sustainVote}</p>
				<p class="intro">{T.sustainOpposed}</p>
			</section>
		{/if}

		<section>
			<div class="row"><span class="k">Abendmahlslied</span><span>{data.hymns.abendmahl}</span></div>
			<div class="row"><span class="k"><strong>Abendmahl</strong></span><span class="stars">★★★★★★★★★★★★★★★★★★★★</span></div>
			<p class="intro">{T.sacramentThanks}</p>
		</section>

		<section>
			{#if data.isFast}
				<div class="row"><span class="k"><strong>{T.testimonies}</strong></span><span></span></div>
				<div class="row"><span class="k">Zwischenlied</span><span>{data.hymns.zwischen}</span></div>
			{:else}
				{#each data.program as p}
					<div class="row"><span class="k">{p.label}</span><span class="d">{p.detail}</span><span class="t">{p.time}</span></div>
				{/each}
			{/if}
		</section>

		<section>
			<p class="intro">{T.closingThanks}</p>
			<div class="row"><span class="k">Schlusslied</span><span>{data.hymns.schluss}</span></div>
			<div class="row"><span class="k">Schlussgebet</span><span>{data.prayers.closing}</span></div>
			<p class="intro">{T.closingBishopric}</p>
			<div class="row"><span class="k">{T.closingMusic}</span><span>Orgel: {data.organist || '____'} · Dirigieren: {data.conductor || '____'}</span></div>
			<div class="row"><span class="k">{T.closingInvite}</span><span></span></div>
			<div class="row"><span class="k">{T.closingGreeting}</span><span></span></div>
		</section>
	{/if}
</article>

<style>
	:global(body) { background: #e9e8e3; }
	.toolbar { display: flex; gap: 0.5rem; justify-content: center; padding: 0.75rem; }
	.sheet { width: 210mm; min-height: 297mm; margin: 0 auto 2rem; background: #fff; padding: 15mm 18mm; box-sizing: border-box; color: #111; font-size: 12pt; line-height: 1.35; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12); }
	.head { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 2px solid #111; padding-bottom: 4mm; margin-bottom: 4mm; }
	.lbl { color: #555; }
	.theme { margin: 0 0 4mm; }
	section { margin-bottom: 5mm; }
	h2 { font-size: 12pt; margin: 0 0 1.5mm; text-transform: uppercase; letter-spacing: 0.04em; color: #333; }
	.row { display: flex; gap: 3mm; align-items: baseline; padding: 1.2mm 0; border-bottom: 1px dotted #bbb; }
	.row .k { flex: 0 0 48mm; }
	.row .d { flex: 1; }
	.row .t { flex: 0 0 30mm; text-align: right; color: #444; font-variant-numeric: tabular-nums; }
	.box { flex: 0 0 5mm; }
	.boxed { border: 1px solid #111; padding: 3mm 4mm; }
	.intro { font-style: italic; color: #333; margin: 1.5mm 0; }
	ul { margin: 1mm 0 1mm 5mm; padding: 0; }
	.stars { letter-spacing: 1px; }
	.muted { color: #777; }
	.big { font-size: 14pt; }
	@media (max-width: 220mm) { .sheet { width: 100%; min-height: auto; padding: 6mm; } }
	@page { size: A4 portrait; margin: 12mm; }
	@media print {
		:global(body) { background: #fff; }
		.sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
		section, .boxed { break-inside: avoid; }
	}
</style>
