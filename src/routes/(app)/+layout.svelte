<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { connectLive, live } from '$lib/live.svelte';
	let { data, children } = $props();

	// Live channel: show others' changes immediately, report and display presence.
	let conn: ReturnType<typeof connectLive> | undefined;
	onMount(() => {
		conn = connectLive(() => page.url.pathname);
		return conn.disconnect;
	});
	$effect(() => {
		page.url.pathname;
		conn?.pageChanged();
	});
	const othersHere = $derived([...new Set(live.others.filter((o) => o.page === page.url.pathname && o.userId !== data.user?.id).map((o) => o.name))]);
	/** Marks the field (or its .field wrapper) another user is in; CSS shows outline and name. */
	$effect(() => {
		const marked: Element[] = [];
		for (const o of live.others) {
			if (o.page !== page.url.pathname || o.userId === data.user?.id || !o.field) continue;
			const el = document.getElementById(o.field);
			const box = el?.closest('.field') ?? el;
			if (box) { box.setAttribute('data-live-user', o.name); marked.push(box); }
		}
		return () => marked.forEach((b) => b.removeAttribute('data-live-user'));
	});
	const isActive = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
	const role = $derived(data.user?.role);
	const accountRole = $derived(data.accountRole);
	const ROLE_LABELS: Record<string, string> = { admin: 'Admin', bischofschaft: 'Bischofschaft', gebete: 'Gebete', musik: 'Musik', dirigent: 'Dirigent/in', jm_berater: 'JM-Berater', jd_leitung: 'JD-Leitung' };
	function submitOnChange(e: Event) {
		(e.currentTarget as HTMLSelectElement).form?.requestSubmit();
	}
</script>

<nav class="topnav no-print">
	<div class="inner">
		<div class="nav-links">
			<a href="/" class:active={isActive('/')}>Sonntage</a>
			{#if data.canHymns}<a href="/lieder" class:active={isActive('/lieder')}>Lieder</a>{/if}
			{#if data.canAsk}<a href="/fragen" class:active={isActive('/fragen') || isActive('/mitglieder')}>Fragen</a>{/if}
			{#if data.canYouth}<a href="/jugend" class:active={isActive('/jugend')}>Jugend</a>{/if}
			{#if role === 'admin'}
				<a href="/einstellungen" class:active={isActive('/einstellungen')}>Einstellungen</a>
			{/if}
		</div>
		<div class="nav-user">
		{#if accountRole === 'admin'}
			<form method="POST" action="/ansicht" class="role-switch">
				<label for="role-view-select">Ansicht als</label>
				<select id="role-view-select" name="role" onchange={submitOnChange}>
					{#each Object.entries(ROLE_LABELS) as [value, label] (value)}
						<option {value} selected={value === role}>{label}</option>
					{/each}
				</select>
			</form>
		{/if}
		<a href="/konto" class="nav-account" class:active={isActive('/konto')} title="Konto und Passwort"><Icon name="user" size={16} /><span>{data.user?.name}</span></a>
		<form method="POST" action="/logout"><button class="btn btn-small" type="submit">Abmelden</button></form>
		</div>
	</div>
</nav>
{#if accountRole === 'admin' && role !== accountRole}
	<div class="view-banner no-print">
		Testansicht als {ROLE_LABELS[role ?? ''] ?? role}
		<form method="POST" action="/ansicht" class="inline-form">
			<input type="hidden" name="role" value="admin" />
			<button class="btn btn-small" type="submit">Zurück zu Admin</button>
		</form>
	</div>
{/if}
<main class="container">
	{#if othersHere.length}
		<p class="live-bar no-print" aria-live="polite"><span class="live-dot" aria-hidden="true"></span>{othersHere.join(', ')} {othersHere.length === 1 ? 'ist' : 'sind'} auch auf dieser Seite</p>
	{/if}
	{@render children()}
</main>
