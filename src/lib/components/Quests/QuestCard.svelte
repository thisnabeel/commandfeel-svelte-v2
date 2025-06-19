<script lang="ts">
	import { slide, scale } from 'svelte/transition';
	import QuestStepRow from '$lib/components/Skills/Tabs/Quests/QuestStep/row.svelte';
	import QuestStepChoices from '$lib/components/Quests/QuestStepChoices.svelte';
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';
	import { hookedOn, hookTied } from './quest-store';

	export let quest: any;
	export let elementType: string;
	export let onDelete: (id: number) => void = () => {}; // Optional callback for deletion

	let selectedQuest: any = null;
	let questSteps: any[] = [];
	let editingStep: any = null;
	let successNodeIn: any = null;
	let loadingSteps = false;
	let error = '';
	let skillId: string | null = null;
	let selectedStepTab: any = null;

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
	async function toggleQuestSteps(quest: any) {
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
		selectedStepTab = null;
	}

	async function openQuestSteps(quest: any) {
		selectedQuest = quest;
		loadingSteps = true;
		try {
			const endpoint = quest.questable?.id
				? `/${elementType}/${quest.questable.id}/quests/${quest.id}/quest_steps`
				: `/quests/${quest.id}/quest_steps`;
			console.log('openQuestSteps', quest);
			questSteps = await API.get(endpoint);
			// Set the first step as selected tab
			if (questSteps.length > 0) {
				selectedStepTab = questSteps[0];
			}
		} catch (err: any) {
			console.error('openQuestSteps', [quest, err]);
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
			return res;
		} catch (err: any) {
			console.error('createStep', [quest, err]);
			error = err.message || 'An error occurred while creating step';
			throw err;
		}
	}

	async function makeNewStepFromChoice(choice: any) {
		console.log('makeNewStepFromChoice', choice);
		newStep.body = choice.body;
		const res = await createStep();
		hookTied.set(res.id);
	}

	function editStep(step: any) {
		editingStep = { ...step };
	}

	async function updateStep() {
		if (!selectedQuest || !editingStep) return;
		try {
			const endpoint = quest.skill_id
				? `/skills/${quest.skill_id}/quests/${selectedQuest.id}/quest_steps/${editingStep.id}`
				: `/quests/${selectedQuest.id}/quest_steps/${editingStep.id}`;
			await API.put(endpoint, { quest_step: editingStep });
			const index = questSteps.findIndex((s) => s.id === editingStep.id);
			if (index !== -1) questSteps[index] = { ...editingStep };
			editingStep = null;
		} catch (err: any) {
			error = err.message || 'An error occurred while updating step';
		}
	}

	async function deleteStep(stepId: number) {
		if (!selectedQuest) return;
		try {
			const endpoint = quest.skill_id
				? `/${elementType}/${quest.skill_id}/quests/${selectedQuest.id}/quest_steps/${stepId}`
				: `/quests/${selectedQuest.id}/quest_steps/${stepId}`;
			await API.delete(endpoint);
			questSteps = questSteps.filter((s) => s.id !== stepId);
		} catch (err: any) {
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

	function selectSuccessNodeIn(step: any) {
		successNodeIn = step;
	}

	async function selectSuccessNodeOut(step: any) {
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
		} catch (err: any) {
			error = err.message || 'An error occurred while updating step connection';
		}
	}

	async function handleImageUpload(event: any, step: any) {
		if (!selectedQuest) return;

		const file = event.target.files[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);

		// console.log({ skillId }, { selectedQuest });

		try {
			const endpoint = selectedQuest.skill_id
				? `/skills/${selectedQuest.skill_id}/quests/${selectedQuest.id}/quest_steps/${step.id}/upload_image`
				: `/quests/${selectedQuest.id}/quest_steps/${step.id}/upload_image`;
			const res = await API.post(endpoint, formData);

			const index = questSteps.findIndex((s) => s.id === step.id);
			if (index !== -1) {
				questSteps[index] = { ...questSteps[index], image_url: res.image_url };
				questSteps = [...questSteps];
			}
		} catch (err: any) {
			error = err.message || 'An error occurred while uploading image';
		}
	}

	function playQuest(quest: any) {
		goto(`/quests/${quest.id}/play`);
	}

	async function generateQuestSteps(quest: any, level: string) {
		try {
			loadingSteps = true;
			await API.post(`/quests/${quest.id}/quest_wizard`, { level });
			await openQuestSteps(quest);
		} catch (err: any) {
			error = err.message || 'Failed to generate quest steps';
		} finally {
			loadingSteps = false;
		}
	}

	function selectStepTab(step: any) {
		selectedStepTab = step;
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
					<div class="mt-4 text-center">
						<p class="text-muted">Or create steps manually below</p>
					</div>
				</div>
			{/if}

			<!-- Quest Steps Tabs -->
			{#if questSteps.length > 0}
				<div class="steps-tabs-container">
					<div class="steps-tabs-scroll">
						<div class="steps-tabs">
							{#each questSteps as step, index}
								<button
									class="step-tab"
									class:hook-ready={$hookedOn}
									class:active={selectedStepTab?.id === step.id}
									on:click={() => {
										if ($hookedOn) {
											hookTied.set(step.id);
										} else {
											selectStepTab(step);
										}
									}}
								>
									<span class="step-number">{step.position}</span>
									<span class="step-title">{step.body.slice(0, 30)}...</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Selected Step Content -->
					{#if selectedStepTab}
						<div class="step-content" transition:slide>
							<div class="step-header">
								<h4>Step {selectedStepTab.position}</h4>
								<div class="step-actions">
									<button class="btn-secondary" on:click={() => editStep(selectedStepTab)}
										>Edit</button
									>
									<button class="btn-danger" on:click={() => deleteStep(selectedStepTab.id)}
										>Delete</button
									>
								</div>
							</div>

							<div class="step-body">
								<p class="step-text">{selectedStepTab.body}</p>

								{#if selectedStepTab.image_url}
									<div class="step-image-container">
										<img src={selectedStepTab.image_url} alt="Step Image" class="step-image" />
									</div>
								{/if}

								<div class="step-details">
									<div class="detail-item">
										<strong>Success Step ID:</strong>
										{selectedStepTab.success_step_id || 'None'}
									</div>
									<div class="detail-item">
										<strong>Failure Step ID:</strong>
										{selectedStepTab.failure_step_id || 'None'}
									</div>
									<div class="detail-item">
										<strong>Quest Reward ID:</strong>
										{selectedStepTab.quest_reward_id || 'None'}
									</div>
								</div>

								<!-- Image Upload Section -->
								<div class="image-upload-section">
									<h5>Step Image</h5>
									<div class="image-actions">
										<input
											type="file"
											class="file-input"
											on:change={(e) => handleImageUpload(e, selectedStepTab)}
											accept="image/*"
										/>
										<label for="file-input" class="file-label">Choose Image</label>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Quest Step Choices Management -->
			{#if selectedStepTab}
				<div class="choices-management-container" transition:slide>
					<h4>Choices for Step {selectedStepTab.position}</h4>
					<QuestStepChoices questStepId={selectedStepTab.id} {makeNewStepFromChoice} />
				</div>
			{/if}

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

	.hook-ready {
		display: inline-block;
		animation: vibrate 0.4s linear infinite;
	}

	@keyframes vibrate {
		0% {
			transform: translate(0);
		}
		25% {
			transform: translate(-0.5px, 0.5px);
		}
		50% {
			transform: translate(0.5px, -0.5px);
		}
		75% {
			transform: translate(-0.5px, -0.5px);
		}
		100% {
			transform: translate(0.5px, 0.5px);
		}
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

	.choices-management-container {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		border: 1px solid #dee2e6;
	}

	.choices-management-container h4 {
		margin: 0 0 1rem;
		color: #2c3e50;
		font-size: 1.1rem;
	}

	.choices-actions {
		margin-top: 1rem;
		text-align: right;
	}

	.steps-tabs-container {
		position: relative;
		margin-bottom: 2rem;
	}

	.steps-tabs-scroll {
		overflow-x: auto;
		padding: 0.5rem;
	}

	.steps-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.step-tab {
		background: #f8f9fa;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 120px;
		white-space: nowrap;
	}

	.step-tab:hover {
		background: #e9e9e9;
	}

	.step-tab.active {
		background: #3498db;
		color: white;
	}

	.step-number {
		font-weight: bold;
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
	}

	.step-title {
		font-size: 0.8rem;
		text-align: center;
		line-height: 1.2;
	}

	.step-content {
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		padding: 1.5rem;
	}

	.step-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.step-actions {
		display: flex;
		gap: 0.5rem;
	}

	.step-text {
		margin-bottom: 1rem;
	}

	.step-image-container {
		margin-bottom: 1rem;
	}

	.step-image {
		width: 100%;
		max-height: 300px;
		object-fit: cover;
	}

	.step-details {
		margin-bottom: 1rem;
	}

	.detail-item {
		margin-bottom: 0.5rem;
	}

	.image-upload-section {
		margin-top: 1rem;
	}

	.image-actions {
		display: flex;
		gap: 0.5rem;
	}

	.file-input {
		display: none;
	}

	.file-label {
		background: #3498db;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
