<script>
	import { afterNavigate } from '$app/navigation';
	import Portfolio from '$lib/components/Portfolio/Show.svelte';
	import { showGuideButton } from '$lib/stores/view';
	import { onMount } from 'svelte';

	afterNavigate(() => {
		showGuideButton.set(false);
	});
</script>

<Portfolio />

<style>
</style>
