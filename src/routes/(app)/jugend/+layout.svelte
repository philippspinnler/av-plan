<script lang="ts">
	import { page } from '$app/state';
	let { data, children } = $props();
	const link = $derived(data.youthToken ? `${page.url.origin}/j/${data.youthToken}` : '');
	let copied = $state(false);
	async function copy() {
		await navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
	const tabs = [
		{ href: '/jugend', label: 'Aktivitäten' },
		{ href: '/jugend/sonntage', label: 'Sonntage' },
		{ href: '/jugend/ideen', label: 'Aktivitäts-Ideen' },
		{ href: '/jugend/ausfaelle', label: 'Ausfälle & Pfahltermine' }
	];
	// A date page belongs to the tab of its weekday.
	const current = $derived.by(() => {
		const p = page.url.pathname;
		const m = p.match(/^\/jugend\/(\d{4}-\d{2}-\d{2})$/);
		if (m) return new Date(m[1] + 'T00:00:00Z').getUTCDay() === 0 ? '/jugend/sonntage' : '/jugend';
		return tabs.find((t) => t.href !== '/jugend' && p.startsWith(t.href))?.href ?? '/jugend';
	});
</script>

<div class="section-title">
	<h1>Jugend</h1>
	{#if link}
		<p class="public-link">
			<a href={link} rel="noopener noreferrer">{link}</a>
			<button class="btn btn-small" type="button" onclick={copy}>{copied ? 'Kopiert' : 'Link kopieren'}</button>
		</p>
	{/if}
</div>
<nav class="subnav">
	{#each tabs as t}<a href={t.href} class:active={current === t.href}>{t.label}</a>{/each}
</nav>
{@render children()}

<style>
	.public-link { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 0; font-size: 0.9rem; }
	.public-link a { overflow-wrap: anywhere; }
</style>
