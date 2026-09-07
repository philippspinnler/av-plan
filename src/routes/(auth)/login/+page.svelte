<script lang="ts">
	let { form, data } = $props();
</script>

<main class="container auth-box">
	<div class="card">
		<h1>Anmelden</h1>
		{#if form?.error}<div class="error">{form.error}</div>{/if}
		<form method="POST" action="?next={encodeURIComponent(data.next)}">
			<div class="field"><label for="email">E-Mail</label><input id="email" name="email" type="email" required autocomplete="username" value={form?.email ?? ''} /></div>
			<div class="field"><label for="password">Passwort</label><input id="password" name="password" type="password" required autocomplete="current-password" /></div>
			<button class="btn btn-primary" type="submit">Anmelden</button>
		</form>
	</div>
</main>
