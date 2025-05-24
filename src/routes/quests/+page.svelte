<script>
	import PopularQuestsSampler from '$lib/components/Quests/PopularQuestsSampler.svelte';
</script>

<div class="container mt-5">
	<h1 class="mb-4">Popular Quests</h1>
	<PopularQuestsSampler />
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
