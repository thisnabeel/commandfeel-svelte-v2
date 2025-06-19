<script>
	import PopularQuestsSampler from '$lib/components/Quests/PopularQuestsSampler.svelte';
	import { user } from '$lib/stores/user';
	import QuestsAdmin from '$lib/components/Quests/Admin/Index.svelte';
</script>

<div class="container mt-5">
	<!-- <h1 class="mb-4">Popular Quests</h1> -->
	<!-- <PopularQuestsSampler /> -->
	{#if $user && $user.admin}
		<h1>Admin</h1>
		<QuestsAdmin />
	{/if}
</div>

<style>
	h1 {
		color: #333;
		font-family: 'GreycliffCF-Regular';
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}
</style>
