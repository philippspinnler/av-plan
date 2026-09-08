<script lang="ts">
	import { page } from '$app/state';
	let { data, children } = $props();
	const isActive = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
	const role = $derived(data.user?.role);
	const accountRole = $derived(data.accountRole);
	const ROLE_LABELS: Record<string, string> = { admin: 'Admin', bischofschaft: 'Bischofschaft', musik: 'Musik', dirigent: 'Dirigent/in' };
	function submitOnChange(e: Event) {
		(e.currentTarget as HTMLSelectElement).form?.requestSubmit();
	}
</script>

<nav class="topnav no-print">
	<div class="inner">
		<a href="/" class:active={isActive('/')}>Sonntage</a>
		<a href="/lieder" class:active={isActive('/lieder')}>Lieder</a>
		<a href="/mitglieder" class:active={isActive('/mitglieder')}>Mitglieder</a>
		<a href="/pfahlbeamte" class:active={isActive('/pfahlbeamte')}>Pfahlbeamte</a>
		{#if role === 'admin'}
			<a href="/admin/benutzer" class:active={isActive('/admin')}>Benutzer</a>
			<a href="/einstellungen" class:active={isActive('/einstellungen')}>Einstellungen</a>
		{/if}
		<span class="spacer"></span>
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
		<span class="muted">{data.user?.name}</span>
		<form method="POST" action="/logout"><button class="btn btn-small" type="submit">Abmelden</button></form>
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
	{@render children()}
</main>
