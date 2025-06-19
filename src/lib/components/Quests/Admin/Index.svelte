<script>
	import API from '$lib/api/api';
	import { onMount } from 'svelte';
	import QuestCard from '$lib/components/Quests/QuestCard.svelte';

	let quests = [];
	let showCreateForm = false;
	let newQuest = {
		title: '',
		description: ''
	};
	let creating = false;

	onMount(async () => {
		await fetchQuests();
	});

	async function fetchQuests() {
		try {
			quests = await API.get('/quests');
			console.log(quests);
		} catch (error) {
			console.error('Failed to fetch quests:', error);
		}
	}

	async function createQuest() {
		if (!newQuest.title.trim()) return;

		try {
			creating = true;
			const response = await API.post('/quests', {
				quest: newQuest
			});
			quests = [...quests, response];
			newQuest = { title: '', description: '' };
			showCreateForm = false;
		} catch (error) {
			console.error('Failed to create quest:', error);
		} finally {
			creating = false;
		}
	}

	function handleDelete(questId) {
		quests = quests.filter((q) => q.id !== questId);
	}
</script>

<div class="quests-container">
	<div class="header">
		<h2>Quests</h2>
		<button class="btn btn-primary create-btn" on:click={() => (showCreateForm = !showCreateForm)}>
			<i class="fa fa-plus" /> Create New Quest
		</button>
	</div>

	{#if showCreateForm}
		<div class="create-form">
			<div class="form-group">
				<label for="title">Title</label>
				<input
					type="text"
					id="title"
					class="form-control"
					bind:value={newQuest.title}
					placeholder="Enter quest title"
				/>
			</div>
			<div class="form-group">
				<label for="description">Description</label>
				<textarea
					id="description"
					class="form-control"
					bind:value={newQuest.description}
					placeholder="Enter quest description"
					rows="3"
				/>
			</div>

			<div class="form-actions">
				<button
					class="btn btn-secondary"
					on:click={() => {
						showCreateForm = false;
						newQuest = { title: '', description: '' };
					}}
				>
					Cancel
				</button>
				<button
					class="btn btn-primary"
					on:click={createQuest}
					disabled={creating || !newQuest.title.trim()}
				>
					{#if creating}
						<i class="fa fa-spinner fa-spin" /> Creating...
					{:else}
						Create Quest
					{/if}
				</button>
			</div>
		</div>
	{/if}

	<div class="quests">
		{#each quests as quest}
			<QuestCard {quest} elementType="quest" onDelete={() => handleDelete(quest.id)} />
		{/each}
	</div>
</div>

<style>
	.quests-container {
		padding: 1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.header h2 {
		margin: 0;
		color: #333;
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
	}

	.create-form {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		border: 1px solid #dee2e6;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	.form-control {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 1rem;
	}

	.form-control:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.quests {
		display: grid;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.create-btn {
			justify-content: center;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
