<script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();
	const tabs = [
		{ href: '/jugend/ideen', label: 'Ideen' },
		{ href: '/jugend/ausfaelle', label: 'Ausfälle & Pfahltermine' }
	];
</script>

<h1>Jugend</h1>
<nav class="subnav">
	<a href="/jugend" class:active={!tabs.some((t) => page.url.pathname.startsWith(t.href))}>Termine</a>
	{#each tabs as t}<a href={t.href} class:active={page.url.pathname.startsWith(t.href)}>{t.label}</a>{/each}
</nav>
{@render children()}
