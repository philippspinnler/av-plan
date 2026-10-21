<script lang="ts">
	import YouthList from '../YouthList.svelte';
	let { data } = $props();
</script>

<YouthList {data} />
