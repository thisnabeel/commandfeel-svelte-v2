<script>
	import { user } from '$lib/stores/user';
	import OccupationsIndex from '$lib/components/Occupations/Index.svelte';
</script>

<svelte:head>
	<title>Occupations</title>
</svelte:head>

{#if $user?.admin}
	<OccupationsIndex />
{:else}
	<p class="unauthorized">Admin access required.</p>
{/if}

<style>
	.unauthorized {
		padding: 2rem;
		text-align: center;
		color: #666;
	}
</style>
