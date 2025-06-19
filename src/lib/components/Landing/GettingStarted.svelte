<script>
	import { onMount } from 'svelte';
	import API from '$lib/api/api';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let quest = null;
	let questSteps = [];
	let currentStep = null;
	let displayedText = '';
	let started = false;
	let choices = [];
	let loading = false;
	let selectedChoiceId = null;
	let selectedChoiceCorrect = false;
	let selectedChoice = null;
	let wrongChoices = new Set();
	let typing = false;
	let skipAnimation = false;
	let cancelled = false;
	export let autoStart = false;

	onMount(async () => {
		console.log('GettingStarted');
		await fetchQuest();
	});

	async function fetchQuest() {
		try {
			quest = await API.get('/quests/by_code?code=getting-started');
			if (quest) {
				questSteps = quest.steps || [];
				if (autoStart) {
					started = true;
					startAtFirstStep();
				}
			}
		} catch (error) {
			console.error('Failed to fetch quest:', error);
		}
	}

	async function fetchChoices(stepId) {
		try {
			loading = true;
			const response = await API.get(`/quest_steps/${stepId}/quest_step_choices`);
			choices = response;
			loading = false;
		} catch (e) {
			console.error('Failed to load choices:', e);
			loading = false;
			choices = [];
		}
	}

	function startAtFirstStep() {
		currentStep = questSteps.sort((a, b) => a.position - b.position)[0];
		if (currentStep) {
			displayedText = '';
			typeText(currentStep.body);
			fetchChoices(currentStep.id);
		}
	}

	function skipTyping(text) {
		cancelled = true;
		typing = false;
		skipAnimation = true;
		displayedText = text;
	}

	async function typeText(text) {
		if (skipAnimation) {
			displayedText = text;
			skipAnimation = false;
			return;
		}

		cancelled = false;
		typing = true;
		const sentences = text.split(/(?<=[.?!])\s+/);
		displayedText = '';

		for (const sentence of sentences) {
			if (cancelled) break;
			await typeSentence(sentence);
		}

		typing = false;
	}

	function typeSentence(sentence) {
		return new Promise((resolve) => {
			let i = 0;
			const interval = setInterval(() => {
				if (cancelled || i >= sentence.length) {
					clearInterval(interval);
					if (!cancelled) {
						displayedText += '\n';
					}
					resolve();
				} else {
					displayedText += sentence[i];
					i++;
				}
			}, 70);
		});
	}

	async function makeChoice(choice) {
		selectedChoice = choice;
		selectedChoiceId = choice.id;
		selectedChoiceCorrect = choice.status;

		if (!choice.status) {
			wrongChoices.add(choice.id);
		}

		// If the choice has a next_step_id, navigate to that step immediately
		if (choice.next_step_id) {
			const nextStep = questSteps.find((s) => s.id === choice.next_step_id);
			if (nextStep) {
				selectedChoice = null;
				selectedChoiceId = null;
				wrongChoices.clear();
				currentStep = nextStep;
				displayedText = '';
				typeText(nextStep.body);
				fetchChoices(nextStep.id);
			}
		}
	}

	async function goToNextStep() {
		if (!currentStep) return;

		// Check if the selected choice has a next_step_id
		if (selectedChoice?.next_step_id) {
			const nextStep = questSteps.find((s) => s.id === selectedChoice.next_step_id);
			if (nextStep) {
				selectedChoice = null;
				selectedChoiceId = null;
				wrongChoices.clear();
				currentStep = nextStep;
				displayedText = '';
				typeText(nextStep.body);
				fetchChoices(nextStep.id);
				return;
			}
		}

		// Fallback to the original success_step_id logic
		if (currentStep.success_step_id) {
			const nextStep = questSteps.find((s) => s.id === currentStep.success_step_id);
			if (nextStep) {
				selectedChoice = null;
				selectedChoiceId = null;
				wrongChoices.clear();
				currentStep = nextStep;
				displayedText = '';
				typeText(nextStep.body);
				fetchChoices(nextStep.id);
			}
		}
	}

	function finishQuest() {
		// Navigate to a completion page or reset
		started = false;
		currentStep = null;
		selectedChoice = null;
		selectedChoiceId = null;
		wrongChoices.clear();
	}
</script>

<section class="landing">
	{#if !started}
		<div class="start-container">
			<h1>Let's get you started:</h1>
			{#if quest}
				<div class="quest-info">
					<h2>{quest.title}</h2>
					<p>{quest.description}</p>
					{#if questSteps.length > 0}
						<button
							class="btn btn-primary btn-lg mt-3"
							on:click={() => {
								started = true;
								startAtFirstStep();
							}}
						>
							Start Quest
						</button>
					{:else}
						<div class="text-center">
							<p>This quest has no steps yet.</p>
						</div>
					{/if}
				</div>
			{:else}
				<div class="title">Loading...</div>
			{/if}
		</div>
	{:else if currentStep}
		<div class="game-container">
			{#if currentStep.image_url}
				<img
					class="step-image"
					src={currentStep.image_url}
					alt="Quest Step Image"
					transition:fade={{ duration: 500 }}
				/>
			{/if}

			<div
				class="typewriter mb-3 text-start"
				on:click={() => typing && skipTyping(currentStep.body)}
				class:clickable={typing}
			>
				{displayedText}
			</div>

			{#if !typing && !loading}
				<div class="choices-container text-start">
					{#if choices.length > 0}
						{#each choices as choice (choice.id)}
							<div class="choice-wrapper">
								<button
									class="btn choice-btn"
									class:btn-outline-primary={!selectedChoiceId ||
										(selectedChoiceId !== choice.id && !wrongChoices.has(choice.id))}
									class:btn-success={selectedChoiceId === choice.id && selectedChoiceCorrect}
									class:btn-danger={(selectedChoiceId === choice.id && !selectedChoiceCorrect) ||
										wrongChoices.has(choice.id)}
									on:click={() => makeChoice(choice)}
									transition:fade
								>
									{choice.body}
								</button>

								{#if selectedChoice?.id === choice.id}
									<div
										class="reasoning-container"
										class:success={selectedChoice.status}
										class:error={!selectedChoice.status}
										transition:fade
									>
										<p>{selectedChoice.reasoning}</p>
									</div>
								{/if}
							</div>
						{/each}

						{#if selectedChoice?.status || selectedChoice?.next_step_id}
							<div class="next-button-container" transition:fade>
								{#if selectedChoice?.next_step_id || currentStep.success_step_id}
									<button class="btn btn-success next-btn" on:click={goToNextStep}>
										<span>Next</span>
										<i class="fa fa-arrow-right" />
									</button>
								{:else}
									<button class="btn btn-success next-btn finish-btn" on:click={finishQuest}>
										<span>Finish Quest</span>
										<i class="fa fa-flag-checkered" />
									</button>
								{/if}
							</div>
						{/if}
					{:else}
						<div class="next-button-container" transition:fade>
							{#if currentStep.success_step_id}
								<button class="btn btn-success next-btn" on:click={goToNextStep}>
									<span>Continue</span>
									<i class="fa fa-arrow-right" />
								</button>
							{:else}
								<button class="btn btn-success next-btn finish-btn" on:click={finishQuest}>
									<span>Finish Quest</span>
									<i class="fa fa-flag-checkered" />
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<p class="text-center">Loading quest...</p>
	{/if}
</section>

<style>
	.landing {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.start-container {
		text-align: center;
	}

	.quest-info {
		margin-top: 2rem;
	}

	.quest-info h2 {
		color: #333;
		margin-bottom: 1rem;
	}

	.quest-info p {
		color: #666;
		margin-bottom: 2rem;
	}

	.game-container {
		max-width: 600px;
		margin: auto;
		text-align: center;
	}

	.step-image {
		max-width: 300px;
		height: auto;
		border-radius: 10px;
		margin-bottom: 1rem;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease;
	}

	.step-image:hover {
		transform: scale(1.02);
	}

	.typewriter {
		white-space: pre-wrap;
		font-family: monospace;
		font-size: 1.2rem;
		color: #333;
		cursor: default;
		text-align: left;
		line-height: 1.6;
	}

	.typewriter.clickable {
		cursor: pointer;
	}

	.choices-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.choice-wrapper {
		margin-bottom: 0.75rem;
		width: 100%;
	}

	.choice-btn {
		width: 100%;
		text-align: left;
		white-space: normal;
		padding: 0.75rem 1rem;
		transition: all 0.3s ease;
	}

	.choice-btn:hover {
		transform: translateX(5px);
	}

	.btn-success {
		background-color: #98fb98 !important;
		border-color: #98fb98 !important;
		color: #000 !important;
	}

	.btn-danger {
		background-color: #ff6b6b !important;
		border-color: #ff6b6b !important;
		color: #fff !important;
	}

	.reasoning-container {
		margin-top: 0.5rem;
		margin-left: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.95rem;
		line-height: 1.5;
		animation: fadeIn 0.3s ease-in-out;
		border-left-width: 3px;
		border-left-style: solid;
	}

	.reasoning-container p {
		margin: 0;
		color: #333;
	}

	.reasoning-container.success {
		background-color: rgba(152, 251, 152, 0.15);
		border-left-color: #98fb98;
	}

	.reasoning-container.error {
		background-color: rgba(255, 107, 107, 0.15);
		border-left-color: #ff6b6b;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.next-button-container {
		margin-top: 1.5rem;
		text-align: center;
	}

	.next-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 1.1rem;
		background-color: #98fb98;
		border: none;
		border-radius: 8px;
		color: #000;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.next-btn:hover {
		transform: translateX(5px);
		background-color: #90ee90;
	}

	.next-btn i {
		font-size: 1rem;
	}

	.finish-btn {
		background-color: #ffd700 !important;
		color: #000 !important;
	}

	.finish-btn:hover {
		background-color: #ffed4a !important;
	}

	@media (max-width: 768px) {
		.landing {
			padding: 1rem;
		}

		.typewriter {
			font-size: 1rem;
		}

		.choice-btn {
			padding: 0.5rem 0.75rem;
		}
	}
</style>
