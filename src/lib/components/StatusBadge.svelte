<script lang="ts">
	import type { Status } from '$lib/server/db/schema';
	let { status }: { status: Status } = $props();
	const labels: Record<Status, string> = { offen: 'Offen', angefragt: 'Angefragt', zugesagt: 'Zugesagt' };
</script>

<span class="badge badge-{status}">{labels[status]}</span>
