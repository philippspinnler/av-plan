<script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();
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

<h1>Jugend</h1>
<nav class="subnav">
	{#each tabs as t}<a href={t.href} class:active={current === t.href}>{t.label}</a>{/each}
</nav>
{@render children()}
