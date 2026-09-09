<script lang="ts">
	import { page } from '$app/state';
	let { data, children } = $props();
</script>

<h1>Fragen</h1>
<nav class="subnav">
	{#each data.tabs as t}<a href={t.href} class:active={page.url.pathname.startsWith(t.href)}>{t.label}</a>{/each}
</nav>
{@render children()}
