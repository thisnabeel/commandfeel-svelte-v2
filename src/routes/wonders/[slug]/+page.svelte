<script>
	import { onMount, beforeUpdate } from 'svelte';

	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import Api from '$lib/api/api.js';

	import Wonder from '$lib/components/Wonders/Show.svelte';
	import { mapShown, selectWonder, selectedWonder } from '$lib/stores/main';
	// import { navigating } from '$app/stores';
	import { globalViewCategory } from '$lib/stores/view';

	let wonder;
	let changedSlug;

	onMount(async function () {
		globalViewCategory.set('Wonders');
		wonder = await Api.get('/wonders/' + $page.params.slug + '.json');
		console.log('SKILL FIND', wonder);
	});

	afterNavigate(async function () {
		fetchWonder($page.params.slug);
		globalViewCategory.set('Wonders');
	});

	const fetchWonder = async (slug) => {
		wonder = await Api.get('/wonders/' + slug + '.json');
		mapShown.set(false);
		selectWonder(wonder);
		console.log('gotten', wonder);
	};
</script>

{#if wonder}
	<Wonder {wonder} />
{/if}
