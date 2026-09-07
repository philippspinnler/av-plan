<script lang="ts">
	let { data, form } = $props();
</script>

<main class="container auth-box">
	<div class="card">
		<h1>Willkommen</h1>
		{#if data.invalid}
			<div class="error">Diese Einladung ist ungültig oder abgelaufen. Bitte melde dich beim Admin.</div>
		{:else}
			<p>Hallo {data.name}, bitte wähle ein Passwort für <strong>{data.email}</strong>.</p>
			{#if form?.error}<div class="error">{form.error}</div>{/if}
			<form method="POST">
				<div class="field"><label for="password">Passwort (mind. 8 Zeichen)</label><input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" /></div>
				<div class="field"><label for="confirm">Passwort wiederholen</label><input id="confirm" name="confirm" type="password" required minlength="8" autocomplete="new-password" /></div>
				<button class="btn btn-primary" type="submit">Konto aktivieren</button>
			</form>
		{/if}
	</div>
</main>
