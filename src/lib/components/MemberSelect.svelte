<script lang="ts">
	let {
		id,
		name,
		options,
		value = null
	}: { id: string; name: string; options: { id: number; label: string; hint: string }[]; value?: number | null } = $props();
</script>

<select {id} {name}>
	<option value="">– niemand –</option>
	{#each options as o}
		<option value={o.id} selected={o.id === value}>{o.label}{o.hint ? ` — ${o.hint}` : ''}</option>
	{/each}
</select>
