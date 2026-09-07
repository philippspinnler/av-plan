<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="container">
	<div class="card">
		<h1>{page.status}</h1>
		<p>{page.error?.message ?? 'Etwas ist schiefgelaufen.'}</p>
		<a class="btn" href="/">Zur Startseite</a>
	</div>
</main>
