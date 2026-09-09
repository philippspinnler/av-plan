<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<h1>Konto</h1>

<div class="section">
	<p><strong>{data.account.name}</strong><br /><span class="muted">{data.account.email} · {data.account.role}</span></p>
</div>

<div class="section">
	<h2>Passwort ändern</h2>
	{#if form?.error}<div class="error">{form.error}</div>{/if}
	{#if form?.changed}<div class="success">Passwort geändert. Andere Geräte müssen sich neu anmelden.</div>{/if}
	<form method="POST" action="?/password" use:enhance class="password-form">
		<div class="field"><label for="current">Bisheriges Passwort</label><input id="current" name="current" type="password" required autocomplete="current-password" /></div>
		<div class="field"><label for="next">Neues Passwort</label><input id="next" name="next" type="password" required minlength={data.minLength} autocomplete="new-password" /></div>
		<div class="field"><label for="repeat">Neues Passwort wiederholen</label><input id="repeat" name="repeat" type="password" required minlength={data.minLength} autocomplete="new-password" /></div>
		<p class="hint">Mindestens {data.minLength} Zeichen.</p>
		<button class="btn btn-primary" type="submit">Passwort ändern</button>
	</form>
</div>

<style>
	.password-form { max-width: 28rem; }
</style>
