<script>
	import API from '$lib/api/api';
	import { onMount } from 'svelte';
	import Algorithms from '$lib/components/Algorithms/Index.svelte';

	// onMount(async () => {
	// 	const response = await API.get('/algorithms.json');
	// 	algorithms.set(response);
	// });
</script>

<!-- <h1>Hello</h1> -->

<!-- {#if $algorithms}
	<ul class="clean-list">
		{#each algorithms as algo}{/each}
	</ul>
{/if} -->

<Algorithms />

<style>
</style>
