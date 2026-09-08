<script lang="ts">
	let {
		id,
		name,
		options,
		value = null,
		form = undefined
	}: { id: string; name: string; options: { id: number; label: string; hint: string }[]; value?: number | null; form?: string } = $props();
</script>

<select {id} {name} {form}>
	<option value="">– niemand –</option>
	{#each options as o}
		<option value={o.id} selected={o.id === value}>{o.label}{o.hint ? ` — ${o.hint}` : ''}</option>
	{/each}
</select>
