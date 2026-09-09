<script lang="ts">
	import { page } from '$app/state';
	let { data } = $props();
	const T = $derived(data.texts);
	/** Ohne Änderungen entfällt der zweite Abschnitt; das Abendmahlslied rückt in den ersten. */
	const hasChanges = $derived(!data.hasProgram ? false : data.releases.length > 0 || data.sustainings.length > 0 || data.stakeChanges);
	const partNo = $derived((n: number) => (hasChanges || n < 2 ? n : n - 1));
	/** Vollbild fürs iPad: nur das Blatt, ohne Leiste und Rahmen. Per Link mit ?vollbild=1 direkt erreichbar. */
	let fullscreen = $state(page.url.searchParams.get('vollbild') === '1');
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') fullscreen = false; }} />

<svelte:head><title>Leitungszettel {data.dateLabel}</title></svelte:head>

{#if fullscreen}
	<button class="btn btn-small close-fs no-print" type="button" onclick={() => (fullscreen = false)} aria-label="Vollbild beenden">✕</button>
{:else}
	<div class="toolbar no-print">
		<button class="btn" type="button" onclick={() => (fullscreen = true)}>Vollbild</button>
		<button class="btn btn-primary" type="button" onclick={() => window.print()}>Drucken</button>
	</div>
{/if}

<article class="sheet" class:fullscreen>
	<header class="head">
		<div><span class="lbl">Datum:</span> <strong>{data.dateLabel}</strong></div>
		<div><span class="lbl">Leitung:</span> <strong>{data.presiding || '________'}</strong></div>
		<div><span class="lbl">Vorsitz:</span> <strong>{data.chair || '________'}</strong></div>
	</header>
	{#if data.guest}<p class="theme"><strong>Gast:</strong> {data.guest}</p>{/if}
	{#if data.theme || data.specialNote}
		<p class="theme">{#if data.theme}<strong>Thema:</strong> {data.theme}{/if}{#if data.specialNote} <em>({data.specialNote})</em>{/if}</p>
	{/if}

	{#if !data.hasProgram}
		<p class="big">{data.kindLabel}: kein Leitungszettel nötig.</p>
	{:else}
		<!-- Jeder Abschnitt = die Leitung steht auf und kündigt an. -->
		<div class="part">
			<span class="part-no" aria-hidden="true">1</span>
			<section>
				<h2>Bekanntmachungen</h2>
				{#if data.announcements.length === 0}<div class="row muted">keine</div>{/if}
				{#each data.announcements as a}<div class="row"><span class="box">□</span><span>{a}</span></div>{/each}
			</section>
			<section>
				<div class="row"><span class="k">Anfangslied</span><span>{data.hymns.anfang}</span></div>
				<div class="row"><span class="k">Anfangsgebet</span><span>{data.prayers.opening}</span></div>
				{#if !hasChanges}<div class="row"><span class="k">Abendmahlslied</span><span>{data.hymns.abendmahl}</span></div>{/if}
			</section>
		</div>

		{#if hasChanges}
		<div class="part">
			<span class="part-no" aria-hidden="true">2</span>
			{#if data.releases.length}
				<section class="boxed">
					<h2>Entlassungen</h2>
					<p class="intro">{T.releaseIntro}</p>
					<ul>{#each data.releases as r}<li><strong>{r.personName}</strong>{#if r.calling}{' – '}{r.calling}{/if}</li>{/each}</ul>
					<p class="intro">{T.releaseVote}</p>
				</section>
			{/if}
			{#if data.sustainings.length}
				<section class="boxed">
					<h2>Berufungen</h2>
					<p class="intro">{T.sustainIntro}</p>
					<ul>{#each data.sustainings as s}<li><strong>{s.personName}</strong>{#if s.calling}{' – '}{s.calling}{/if}</li>{/each}</ul>
					<p class="intro">{T.sustainVote}</p>
					<p class="intro">{T.sustainOpposed}</p>
				</section>
			{/if}
			{#if data.stakeChanges}
				<section class="boxed">
					<h2>Beamtenänderungen vom Pfahl</h2>
					<p class="intro">{T.stakeChanges}</p>
				</section>
			{/if}
			<section>
				<div class="row"><span class="k">Abendmahlslied</span><span>{data.hymns.abendmahl}</span></div>
			</section>
		</div>
		{/if}

		<div class="part">
			<span class="part-no" aria-hidden="true">{partNo(3)}</span>
			<section>
				<p class="intro">{T.sacramentThanks}</p>
				{#if data.isFast}
					<div class="row"><span class="k"><strong>{T.testimonies}</strong></span><span></span></div>
					<div class="row"><span class="k">Zwischenlied</span><span>{data.hymns.zwischen}</span></div>
				{:else}
					{#each data.program as p}
						<div class="row"><span class="k">{p.label}</span><span class="d">{p.detail}</span><span class="t">{p.time}</span></div>
					{/each}
				{/if}
			</section>
		</div>

		<div class="part">
			<span class="part-no" aria-hidden="true">{partNo(4)}</span>
			<section>
				<div class="row"><span class="k">Schlusslied</span><span>{data.hymns.schluss}</span></div>
				<div class="row"><span class="k">Schlussgebet</span><span>{data.prayers.closing}</span></div>
				<p class="intro">{T.closingThanks}</p>
				<div class="row"><span class="k cue">{T.closingMusic}</span><span>Orgel: {data.organist || '____'} · Dirigieren: {data.conductor || '____'}</span></div>
			</section>
		</div>
	{/if}
</article>

<style>
	:global(body) { background: #e9e8e3; }
	.toolbar { display: flex; gap: 0.5rem; justify-content: center; padding: 0.75rem; }
	.sheet { width: 210mm; min-height: 297mm; margin: 0 auto 2rem; background: #fff; padding: 12mm 14mm; box-sizing: border-box; color: #111; font-size: 11pt; line-height: 1.28; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12); }
	.head { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 2px solid #111; padding-bottom: 2.5mm; margin-bottom: 2.5mm; }
	.lbl { color: #555; }
	.theme { margin: 0 0 2.5mm; }
	section { margin-bottom: 2.5mm; }
	/* Abschnitte: die Leitung steht auf. Nummer am Rand, Linie darüber. */
	.part { position: relative; padding: 2mm 0 0 8mm; margin-bottom: 2mm; border-top: 1.5px solid #111; }
	.part > section:last-child { margin-bottom: 0.5mm; }
	.part-no { position: absolute; left: 0; top: 2.2mm; width: 5.5mm; height: 5.5mm; border-radius: 50%; background: #111; color: #fff; font-size: 8.5pt; font-weight: 700; line-height: 5.5mm; text-align: center; }
	h2 { font-size: 10.5pt; margin: 0 0 1mm; text-transform: uppercase; letter-spacing: 0.04em; color: #333; }
	.row { display: flex; gap: 3mm; align-items: baseline; padding: 0.7mm 0; border-bottom: 1px dotted #bbb; }
	.row .k { flex: 0 0 48mm; }
	.row .k.cue { color: #6b6b6b; }
	.row .d { flex: 1; }
	.row .t { flex: 0 0 30mm; text-align: right; color: #444; font-variant-numeric: tabular-nums; }
	.box { flex: 0 0 5mm; }
	.boxed { border: 1px solid #111; padding: 2mm 3mm; }
	/* Hinweistexte (kursiv) kleiner als die eigentlichen Einträge, damit der Zettel auf eine A4-Seite passt. */
	.intro { font-style: italic; color: #6b6b6b; margin: 0.8mm 0; font-size: 9.5pt; line-height: 1.25; }
	ul { margin: 0.5mm 0 0.5mm 5mm; padding: 0; }
	.muted { color: #777; }
	.big { font-size: 14pt; }
	@media (max-width: 220mm) { .sheet { width: 100%; min-height: auto; padding: 6mm; } }
	.sheet.fullscreen { width: 100%; max-width: 1100px; min-height: 100vh; margin: 0 auto; padding: 8mm 10mm; box-shadow: none; font-size: clamp(12pt, 1.6vw, 15pt); }
	.sheet.fullscreen .row .k { flex-basis: 64mm; }
	:global(body:has(.sheet.fullscreen)) { background: #fff; }
	.close-fs { position: fixed; top: 0.5rem; right: 0.5rem; z-index: 10; opacity: 0.6; }
	.close-fs:hover { opacity: 1; }
	@page { size: A4 portrait; margin: 8mm 12mm; }
	@media print {
		:global(body) { background: #fff; }
		.sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
		section, .boxed { break-inside: avoid; }
	}
</style>
