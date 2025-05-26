<script>
	import API from '$lib/api/api';
	import { onMount } from 'svelte';
	import { slide, scale } from 'svelte/transition';
	import QuestStepRow from './QuestStep/row.svelte';
	import { goto } from '$app/navigation';
	import QuestStepChoices from '$lib/components/Quests/QuestStepChoices.svelte';
	import QuestCard from '$lib/components/Quests/QuestCard.svelte';

	export let element;
	export let elementType;
	export let user;

	let quests = [];
	let loading = true;
	let error = '';
	let selectedQuest = null;
	let questSteps = [];
	let editingStep = null;
	let successNodeIn = null;
	let loadingSteps = false;

	let newQuest = {
		title: '',
		description: '',
		position: 0,
		element_id: element.id,
		image_url: '',
		difficulty: 1
	};

	let newStep = {
		image_url: '',
		thumbnail_url: '',
		body: '',
		position: 0,
		success_step_id: null,
		failure_step_id: null,
		quest_reward_id: null
	};

	onMount(async () => {
		await fetchQuests();
	});

	async function fetchQuests() {
		try {
			quests = await API.get(`/${elementType}/${element.id}/quests`);
			loading = false;
		} catch (err) {
			error = err.message || 'An error occurred while fetching quests';
			loading = false;
		}
	}

	async function createQuest() {
		try {
			const createdQuest = await API.post(`/${elementType}/${element.id}/quests`, newQuest);
			quests = [...quests, createdQuest];

			// Reset form
			newQuest = {
				title: '',
				description: '',
				position: quests.length,
				element_id: element.id,
				image_url: '',
				difficulty: 1
			};
		} catch (err) {
			error = err.message || 'An error occurred while creating quest';
		}
	}

	async function updateQuest(quest) {
		if (!quest.id) return;

		try {
			const updatedQuest = await API.put(`/${elementType}/${element.id}/quests/${quest.id}`, quest);
			quests = quests.map((q) => (q.id === updatedQuest.id ? updatedQuest : q));
		} catch (err) {
			error = err.message || 'An error occurred while updating quest';
		}
	}

	async function deleteQuest(questId) {
		if (!questId) return;

		try {
			await API.delete(`/${elementType}/${element.id}/quests/${questId}`);
			quests = quests.filter((q) => q.id !== questId);
			if (selectedQuest?.id === questId) {
				closeQuestSteps();
			}
		} catch (err) {
			error = err.message || 'An error occurred while deleting quest';
		}
	}

	// Quest Steps Management
	async function toggleQuestSteps(quest) {
		if (selectedQuest?.id === quest.id) {
			closeQuestSteps();
		} else {
			await openQuestSteps(quest);
		}
	}

	function closeQuestSteps() {
		selectedQuest = null;
		questSteps = [];
		editingStep = null;
		successNodeIn = null;
	}

	async function openQuestSteps(quest) {
		selectedQuest = quest;
		loadingSteps = true;
		try {
			questSteps = await API.get(`/${elementType}/${element.id}/quests/${quest.id}/quest_steps`);
		} catch (err) {
			error = err.message || 'An error occurred while fetching quest steps';
			closeQuestSteps();
		} finally {
			loadingSteps = false;
		}
	}

	async function createStep() {
		if (!selectedQuest) return;
		try {
			const res = await API.post(`/elements/${element.id}/quests/${selectedQuest.id}/quest_steps`, {
				quest_step: newStep
			});
			questSteps = [...questSteps, res];
			resetNewStep();
		} catch (err) {
			error = err.message || 'An error occurred while creating step';
		}
	}

	function editStep(step) {
		editingStep = { ...step };
	}

	async function updateStep() {
		if (!selectedQuest || !editingStep) return;
		try {
			await API.put(
				`/${elementType}/${element.id}/quests/${selectedQuest.id}/quest_steps/${editingStep.id}`,
				{ quest_step: editingStep }
			);
			const index = questSteps.findIndex((s) => s.id === editingStep.id);
			if (index !== -1) questSteps[index] = { ...editingStep };
			editingStep = null;
		} catch (err) {
			error = err.message || 'An error occurred while updating step';
		}
	}

	async function deleteStep(stepId) {
		if (!selectedQuest) return;
		try {
			await API.delete(
				`/${elementType}/${element.id}/quests/${selectedQuest.id}/quest_steps/${stepId}`
			);
			questSteps = questSteps.filter((s) => s.id !== stepId);
		} catch (err) {
			error = err.message || 'An error occurred while deleting step';
		}
	}

	function resetNewStep() {
		newStep = {
			image_url: '',
			thumbnail_url: '',
			body: '',
			position: questSteps.length,
			success_step_id: null,
			failure_step_id: null,
			quest_reward_id: null
		};
	}

	function selectSuccessNodeIn(step) {
		successNodeIn = step;
	}

	async function selectSuccessNodeOut(step) {
		if (!selectedQuest || !successNodeIn) return;

		try {
			successNodeIn.success_step_id = step.id;
			await API.put(
				`/${elementType}/${element.id}/quests/${selectedQuest.id}/quest_steps/${successNodeIn.id}`,
				{
					quest_step: { success_step_id: step.id }
				}
			);
			questSteps = questSteps.map((s) => (s.id === successNodeIn.id ? { ...successNodeIn } : s));
			successNodeIn = null;
		} catch (err) {
			error = err.message || 'An error occurred while updating step connection';
		}
	}

	async function handleImageUpload(event, step) {
		if (!selectedQuest) return;

		const file = event.target.files[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await API.post(
				`/${elementType}/${element.id}/quests/${selectedQuest.id}/quest_steps/${step.id}/upload_image`,
				formData
			);

			const index = questSteps.findIndex((s) => s.id === step.id);
			if (index !== -1) {
				questSteps[index] = { ...questSteps[index], image_url: res.image_url };
				questSteps = [...questSteps];
			}
		} catch (err) {
			error = err.message || 'An error occurred while uploading image';
		}
	}

	function playQuest(quest) {
		goto(`/quests/${quest.id}/play`);
	}

	async function generateQuestSteps(quest, level) {
		try {
			loadingSteps = true;
			await API.post(`/quests/${quest.id}/quest_wizard`, { level });
			await openQuestSteps(quest);
		} catch (err) {
			error = err.message || 'Failed to generate quest steps';
		} finally {
			loadingSteps = false;
		}
	}
</script>

<div class="quests-container">
	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if loading}
		<div class="loading">Loading quests...</div>
	{:else}
		<!-- Quest Creation Form -->
		<div class="quest-form">
			<h3>Create New Quest</h3>
			<form on:submit|preventDefault={createQuest}>
				<div class="form-group">
					<label for="title">Title</label>
					<input
						type="text"
						id="title"
						bind:value={newQuest.title}
						required
						placeholder="Enter quest title"
					/>
				</div>

				<div class="form-group">
					<label for="description">Description</label>
					<textarea
						id="description"
						bind:value={newQuest.description}
						required
						placeholder="Enter quest description"
						rows="4"
					/>
				</div>

				<div class="form-group">
					<label for="difficulty">Difficulty (1-5)</label>
					<input
						type="number"
						id="difficulty"
						bind:value={newQuest.difficulty}
						min="1"
						max="5"
						required
					/>
				</div>

				<div class="form-group">
					<label for="image_url">Image URL</label>
					<input
						type="url"
						id="image_url"
						bind:value={newQuest.image_url}
						placeholder="https://example.com/image.jpg"
					/>
				</div>

				<button type="submit" class="btn-primary">Create Quest</button>
			</form>
		</div>

		<!-- Quests List -->
		<div class="quests-list">
			{#each quests as quest (quest.id)}
				<QuestCard {quest} elementId={element.id} {elementType} onDelete={deleteQuest} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.quests-container {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.quest-form {
		background: #fff;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.quest-form h3 {
		margin: 0 0 1.5rem;
		color: #2c3e50;
		font-size: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: #2c3e50;
		font-weight: 500;
	}

	input,
	textarea,
	select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
		margin-bottom: 1rem;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
	}

	.quests-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
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

	.btn-primary {
		background: #3498db;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.btn-primary:hover {
		background: #2980b9;
	}
</style>
