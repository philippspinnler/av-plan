<script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();
	const tabs = [
		{ href: '/einstellungen/mitglieder', label: 'Mitglieder' },
		{ href: '/einstellungen/jugendliche', label: 'Jugendliche' },
		{ href: '/einstellungen/pfahlbeamte', label: 'Pfahlbeamte' },
		{ href: '/einstellungen/berufungen', label: 'Berufungen' },
		{ href: '/einstellungen/benutzer', label: 'Benutzer' },
		{ href: '/einstellungen', label: 'Allgemein' }
	];
	const isActive = (href: string) => (href === '/einstellungen' ? page.url.pathname === href : page.url.pathname.startsWith(href));
</script>

<h1>Einstellungen</h1>
<nav class="subnav">
	{#each tabs as t}<a href={t.href} class:active={isActive(t.href)}>{t.label}</a>{/each}
</nav>
{@render children()}
