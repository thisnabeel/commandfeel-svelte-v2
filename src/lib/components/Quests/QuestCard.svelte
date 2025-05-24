<script>
	import { slide, scale } from 'svelte/transition';
	import QuestStepRow from '$lib/components/Skills/Tabs/Quests/QuestStep/row.svelte';
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';

	export let quest;
	export let skillId = null; // Optional, for when used in skills context
	export let onDelete = () => {}; // Optional callback for deletion

	let selectedQuest = null;
	let questSteps = [];
	let editingStep = null;
	let successNodeIn = null;
	let loadingSteps = false;
	let error = '';

	let newStep = {
		image_url: '',
		thumbnail_url: '',
		body: '',
		position: 0,
		success_step_id: null,
		failure_step_id: null,
		quest_reward_id: null
	};

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
			const endpoint = skillId
				? `/skills/${skillId}/quests/${quest.id}/quest_steps`
				: `/quests/${quest.id}/quest_steps`;
			questSteps = await API.get(endpoint);
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
			const endpoint = skillId
				? `/skills/${skillId}/quests/${selectedQuest.id}/quest_steps`
				: `/quests/${selectedQuest.id}/quest_steps`;
			const res = await API.post(endpoint, {
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
			const endpoint = skillId
				? `/skills/${skillId}/quests/${selectedQuest.id}/quest_steps/${editingStep.id}`
				: `/quests/${selectedQuest.id}/quest_steps/${editingStep.id}`;
			await API.put(endpoint, { quest_step: editingStep });
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
			const endpoint = skillId
				? `/skills/${skillId}/quests/${selectedQuest.id}/quest_steps/${stepId}`
				: `/quests/${selectedQuest.id}/quest_steps/${stepId}`;
			await API.delete(endpoint);
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
			const endpoint = skillId
				? `/skills/${skillId}/quests/${selectedQuest.id}/quest_steps/${successNodeIn.id}`
				: `/quests/${selectedQuest.id}/quest_steps/${successNodeIn.id}`;
			await API.put(endpoint, {
				quest_step: { success_step_id: step.id }
			});
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
			const endpoint = skillId
				? `/skills/${skillId}/quests/${selectedQuest.id}/quest_steps/${step.id}/upload_image`
				: `/quests/${selectedQuest.id}/quest_steps/${step.id}/upload_image`;
			const res = await API.post(endpoint, formData);

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

<div class="quest-card">
	<div class="quest-header">
		<h3>{quest.title}</h3>
		<div class="difficulty-badge">Level {quest.difficulty}</div>
	</div>
	<p class="quest-description">{quest.description}</p>
	{#if quest.image_url}
		<img src={quest.image_url} alt={quest.title} class="quest-image" />
	{/if}
	<div class="quest-footer">
		<span class="position-badge">Position: {quest.position}</span>
		<div class="quest-actions">
			<button class="btn-play" on:click={() => playQuest(quest)}> Play Quest </button>
			<button class="btn-secondary" on:click={() => toggleQuestSteps(quest)}>
				{selectedQuest?.id === quest.id ? 'Hide Steps' : 'Manage Steps'}
			</button>
			<button class="btn-danger" on:click={() => onDelete(quest.id)}>Delete</button>
		</div>
	</div>

	<!-- Quest Steps Management -->
	{#if selectedQuest?.id === quest.id}
		<div class="steps-container" transition:slide>
			<h3>Quest Steps for: {quest.title}</h3>

			{#if loadingSteps}
				<div class="loading">Loading steps...</div>
			{:else if questSteps.length === 0}
				<div class="wizard-container" transition:scale>
					<h4 class="mb-4">Generate Quest Steps with AI</h4>
					<div class="d-flex justify-content-center gap-4">
						<button
							class="btn btn-outline-primary btn-lg wizard-btn"
							on:click={() => generateQuestSteps(quest, 'Beginner')}
							disabled={loadingSteps}
						>
							<i class="fa fa-bolt" />
							<span>Beginner</span>
						</button>
						<button
							class="btn btn-outline-warning btn-lg wizard-btn"
							on:click={() => generateQuestSteps(quest, 'Intermediate')}
							disabled={loadingSteps}
						>
							<i class="fa fa-bolt" />
							<i class="fa fa-bolt" />
							<span>Intermediate</span>
						</button>
						<button
							class="btn btn-outline-danger btn-lg wizard-btn"
							on:click={() => generateQuestSteps(quest, 'Hard')}
							disabled={loadingSteps}
						>
							<i class="fa fa-bolt" />
							<i class="fa fa-bolt" />
							<i class="fa fa-bolt" />
							<span>Hard</span>
						</button>
					</div>
					<div class="text-center mt-4">
						<p class="text-muted">Or create steps manually below</p>
					</div>
				</div>
			{/if}

			<table class="steps-table">
				<thead>
					<tr>
						<th>Position</th>
						<th>Image</th>
						<th>Body</th>
						<th>Success Step ID</th>
						<th>Failure Step ID</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each questSteps as step, index}
						<QuestStepRow
							{step}
							{index}
							{successNodeIn}
							{selectSuccessNodeIn}
							{selectSuccessNodeOut}
							{handleImageUpload}
							on:edit={() => editStep(step)}
							on:delete={() => deleteStep(step.id)}
						/>
					{/each}
				</tbody>
			</table>

			{#if editingStep}
				<div class="step-form">
					<h4>Edit Step</h4>
					<div class="form-group">
						<input class="form-control" bind:value={editingStep.body} placeholder="Body" />
						<input
							class="form-control"
							type="number"
							bind:value={editingStep.position}
							placeholder="Position"
						/>
						<select class="form-control" bind:value={editingStep.success_step_id}>
							<option value={null}>None (Success)</option>
							{#each questSteps.filter((s) => s.id !== editingStep.id) as step}
								<option value={step.id}>{step.body.slice(0, 40)}...</option>
							{/each}
						</select>

						<select class="form-control" bind:value={editingStep.failure_step_id}>
							<option value={null}>None (Failure)</option>
							{#each questSteps.filter((s) => s.id !== editingStep.id) as step}
								<option value={step.id}>{step.body.slice(0, 40)}...</option>
							{/each}
						</select>

						<input
							class="form-control"
							type="number"
							bind:value={editingStep.quest_reward_id}
							placeholder="Quest Reward ID"
						/>

						<div class="form-actions">
							<button class="btn-primary" on:click={updateStep}>Save Step</button>
							<button class="btn-secondary" on:click={() => (editingStep = null)}>Cancel</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="step-form">
					<h4>Create New Step</h4>
					<div class="form-group">
						<input class="form-control" bind:value={newStep.body} placeholder="Body" />
						<input
							class="form-control"
							type="number"
							bind:value={newStep.position}
							placeholder="Position"
						/>
						<select class="form-control" bind:value={newStep.success_step_id}>
							<option value={null}>None (Success)</option>
							{#each questSteps as step}
								<option value={step.id}>{step.body.slice(0, 40)}...</option>
							{/each}
						</select>

						<select class="form-control" bind:value={newStep.failure_step_id}>
							<option value={null}>None (Failure)</option>
							{#each questSteps as step}
								<option value={step.id}>{step.body.slice(0, 40)}...</option>
							{/each}
						</select>

						<input
							class="form-control"
							type="number"
							bind:value={newStep.quest_reward_id}
							placeholder="Quest Reward ID"
						/>

						<button class="btn-primary" on:click={createStep}>Create Step</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.quest-card {
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: box-shadow 0.2s;
		width: 100%;
	}

	.quest-card:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.quest-header {
		padding: 1.5rem;
		border-bottom: 1px solid #eee;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #f8f9fa;
	}

	.quest-header h3 {
		margin: 0;
		color: #2c3e50;
		font-size: 1.25rem;
		flex: 1;
	}

	.quest-description {
		padding: 1.5rem;
		color: #34495e;
		margin: 0;
		line-height: 1.6;
		font-size: 1rem;
	}

	.quest-image {
		width: 100%;
		max-height: 300px;
		object-fit: cover;
	}

	.quest-footer {
		padding: 1.5rem;
		border-top: 1px solid #eee;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #f8f9fa;
	}

	.position-badge {
		color: #7f8c8d;
		font-size: 0.875rem;
		background: #fff;
		padding: 0.5rem 1rem;
		border-radius: 999px;
		border: 1px solid #ddd;
	}

	.difficulty-badge {
		background: #3498db;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 999px;
		font-size: 0.875rem;
		margin-left: 1rem;
	}

	.quest-actions {
		display: flex;
		gap: 0.5rem;
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

	.btn-secondary {
		background: #95a5a6;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.btn-secondary:hover {
		background: #7f8c8d;
	}

	.btn-danger {
		background: #e74c3c;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.btn-danger:hover {
		background: #c0392b;
	}

	.btn-play {
		background: #2ecc71;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.btn-play:hover {
		background: #27ae60;
	}

	.steps-container {
		margin-top: 1rem;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.steps-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 2rem;
	}

	.steps-table th,
	.steps-table td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	.steps-table th {
		background: #f8f9fa;
		font-weight: 500;
		color: #2c3e50;
	}

	.step-form {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.step-form h4 {
		margin: 0 0 1rem;
		color: #2c3e50;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-control {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
		margin-bottom: 1rem;
	}

	.form-control:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.wizard-container {
		background: #f8f9fa;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		text-align: center;
	}

	.wizard-btn {
		padding: 1rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
	}

	.wizard-btn:hover {
		transform: translateY(-5px);
	}

	.wizard-btn span {
		display: block;
		margin-top: 0.5rem;
	}

	.wizard-btn i {
		font-size: 1.5rem;
	}

	.wizard-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #7f8c8d;
		font-size: 1.125rem;
	}
</style>
