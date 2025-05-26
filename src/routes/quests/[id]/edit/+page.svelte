<script>
	import { page } from '$app/stores';
	import API from '$lib/api/api';
	import { onMount } from 'svelte';
	import QuestCard from '$lib/components/Quests/QuestCard.svelte';

	let quest = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		await fetchQuest();
	});

	async function fetchQuest() {
		try {
			quest = await API.get(`/quests/${$page.params.id}`);
			loading = false;
		} catch (err) {
			error = err.message || 'An error occurred while fetching quest';
			loading = false;
		}
	}

	async function handleDelete() {
		try {
			await API.delete(`/quests/${quest.id}`);
			window.history.back();
		} catch (err) {
			error = err.message || 'An error occurred while deleting quest';
		}
	}
</script>

<div class="container">
	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if loading}
		<div class="loading">Loading quest...</div>
	{:else if quest}
		<QuestCard {quest} elementType={quest.questable_type} onDelete={handleDelete} />
	{:else}
		<div class="error">Quest not found</div>
	{/if}
</div>

<style>
	.container {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.error {
		background: #fee;
		color: #e74c3c;
		padding: 1rem;
		margin-bottom: 1rem;
		border-radius: 4px;
		border: 1px solid #e74c3c;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #7f8c8d;
		font-size: 1.125rem;
	}
</style>
