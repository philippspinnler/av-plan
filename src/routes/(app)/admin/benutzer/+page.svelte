<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDateShort } from '$lib/dates';
	let { data, form } = $props();
	const roles = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'bischofschaft', label: 'Bischofschaft' },
		{ value: 'musik', label: 'Musik' },
		{ value: 'dirigent', label: 'Dirigent/in' }
	];
	let copied = $state(false);
	const invited = $derived(form?.invited);
	async function copy(text: string) {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<h1>Benutzer</h1>
<p><a class="btn btn-small" href="/admin/export">Datenbank herunterladen (Backup)</a></p>
{#if form?.error}<div class="error">{form.error}</div>{/if}

<div class="section">
	<h2>Neue Person einladen</h2>
	<form method="POST" action="?/invite" use:enhance class="grid-3">
		<div class="field"><label for="inv-name">Name</label><input id="inv-name" name="name" type="text" required /></div>
		<div class="field"><label for="inv-email">E-Mail</label><input id="inv-email" name="email" type="email" required /></div>
		<div class="field">
			<label for="inv-role">Rolle</label>
			<select id="inv-role" name="role">{#each roles as r}<option value={r.value}>{r.label}</option>{/each}</select>
		</div>
		<div class="actions"><button class="btn btn-primary" type="submit">Einladung erzeugen</button></div>
	</form>
	{#if invited}
		<div class="success">Einladung erstellt. Kopiere den Text und schicke ihn der Person.</div>
		<div class="copy-box">{invited.text}</div>
		<div class="actions">
			<button class="btn" type="button" onclick={() => copy(invited.text)}>{copied ? 'Kopiert' : 'Text kopieren'}</button>
			<button class="btn" type="button" onclick={() => copy(invited.link)}>Nur Link kopieren</button>
		</div>
	{/if}
</div>

{#if data.invites.length}
	<div class="section">
		<h2>Offene Einladungen</h2>
		<div class="table-wrap">
			<table class="table">
				<thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Gültig bis</th><th></th></tr></thead>
				<tbody>
					{#each data.invites as inv}
						<tr>
							<td>{inv.name}</td><td>{inv.email}</td><td>{inv.role}</td><td>{formatDateShort(inv.expiresAt.slice(0, 10))}</td>
							<td>
								<form method="POST" action="?/deleteInvite" use:enhance>
									<input type="hidden" name="id" value={inv.id} />
									<button class="btn btn-small btn-danger" type="submit">Löschen</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}

<div class="section">
	<h2>Konten</h2>
	<div class="table-wrap">
		<table class="table">
			<thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Status</th><th></th></tr></thead>
			<tbody>
				{#each data.users as u}
					<tr>
						<td>{u.name}</td>
						<td>{u.email}</td>
						<td>
							{#if u.id === data.user?.id}
								{roles.find((r) => r.value === u.role)?.label}
							{:else}
								<form method="POST" action="?/setRole" use:enhance>
									<input type="hidden" name="id" value={u.id} />
									<select name="role" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}>
										{#each roles as r}<option value={r.value} selected={r.value === u.role}>{r.label}</option>{/each}
									</select>
								</form>
							{/if}
						</td>
						<td>{u.active ? 'aktiv' : 'deaktiviert'}</td>
						<td>
							{#if u.id !== data.user?.id}
								<form method="POST" action="?/setActive" use:enhance>
									<input type="hidden" name="id" value={u.id} />
									<input type="hidden" name="active" value={u.active ? '0' : '1'} />
									<button class="btn btn-small" type="submit">{u.active ? 'Deaktivieren' : 'Aktivieren'}</button>
								</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
