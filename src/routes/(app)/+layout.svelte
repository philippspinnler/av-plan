<script lang="ts">
	import { page } from '$app/state';
	let { data, children } = $props();
	const isActive = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
	const role = $derived(data.user?.role);
</script>

<nav class="topnav no-print">
	<div class="inner">
		<a href="/" class:active={isActive('/')}>Sonntage</a>
		<a href="/lieder" class:active={isActive('/lieder')}>Lieder</a>
		<a href="/mitglieder" class:active={isActive('/mitglieder')}>Personen</a>
		{#if role === 'admin'}
			<a href="/admin/benutzer" class:active={isActive('/admin')}>Benutzer</a>
			<a href="/einstellungen" class:active={isActive('/einstellungen')}>Einstellungen</a>
		{/if}
		<span class="spacer"></span>
		<span class="muted">{data.user?.name}</span>
		<form method="POST" action="/logout"><button class="btn btn-small" type="submit">Abmelden</button></form>
	</div>
</nav>
<main class="container">
	{@render children()}
</main>
