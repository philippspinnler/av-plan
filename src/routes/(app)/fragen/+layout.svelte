<script lang="ts">
	import { page } from '$app/state';
	let { data, children } = $props();
</script>

<h1>Anfragen</h1>
<p class="hint">Wen fragst du als Nächstes für eine Ansprache oder ein Gebet an? Die Listen zeigen, wer am längsten nicht dran war.</p>
<nav class="subnav">
	{#each data.tabs as t}<a href={t.href} class:active={page.url.pathname.startsWith(t.href)}>{t.label}</a>{/each}
</nav>
{@render children()}
