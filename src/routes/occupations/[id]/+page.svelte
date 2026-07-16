<script>
	import { page } from '$app/stores';
	import OccupationShow from '$lib/components/Occupations/Show.svelte';
</script>

<svelte:head>
	<title>Occupation</title>
</svelte:head>

<OccupationShow occupationId={$page.params.id} />
