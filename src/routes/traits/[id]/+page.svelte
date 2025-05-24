<script>
	import { page } from '$app/stores';

	import Api from '$lib/api/api';
	import { onMount } from 'svelte';
	import Trait from '$lib/components/Traits/Trait/Show.svelte';
	import { afterNavigate } from '$app/navigation';

	let trait = null;
	onMount(() => {
		getTrait();
	});

	async function getTrait() {
		const response = await Api.get('/traits/' + $page.params.id + '.json');
		trait = response;
	}

	afterNavigate(async function () {
		getTrait();
	});
</script>

{#if trait}
	<Trait {trait} />
{/if}
