<script lang="ts" generics="K extends string">
	import { toggleSort, type SortState } from '$lib/table-sort';
	let { key, label, sort, onsort }: { key: K; label: string; sort: SortState<K>; onsort: (s: SortState<K>) => void } = $props();
	const active = $derived(sort.key === key);
</script>

<th aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
	<button type="button" class="sort-btn" onclick={() => onsort(toggleSort(sort, key))}>
		{label}<span class="sort-arrow" aria-hidden="true">{active ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
	</button>
</th>
