<script>
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import API from '$lib/api/api';
	import { fade, scale } from 'svelte/transition';
	import { user } from '$lib/stores/user';
	import { layoutClass } from '$lib/stores/view';
	import { goto } from '$app/navigation';

	let typingAudio;
	let correctAudio;
	let wrongAudio;
	let questId;
	let quest = null;
	let questSteps = [];
	let currentStep = null;
	let displayedText = '';
	let started = false;
	let choices = [];
	let loading = false;
	let selectedChoiceId = null;
	let selectedChoiceCorrect = false;
	let error = null;
	let selectedChoice = null;
	let wrongChoices = new Set();
	let typing = false;
	let skipAnimation = false;
	let cancelled = false;

	onMount(() => {
		layoutClass.set('questView');
		typingAudio = new Audio('/sounds/typing.mp3');
		typingAudio.loop = true;
		typingAudio.volume = 0.5;

		correctAudio = new Audio('/passing.mp3');
		correctAudio.volume = 0.5;

		wrongAudio = new Audio('/failing.mp3');
		wrongAudio.volume = 0.5;
	});

	onDestroy(() => {
		layoutClass.set('defaultView');
	});

	page.subscribe(($page) => {
		questId = $page.params.id;
	});

	onMount(async () => {
		await fetchQuestSteps();
	});

	async function fetchQuestSteps() {
		quest = await API.get(`/quests/${questId}`);
		questSteps = quest.steps;
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
			choices = []; // Ensure choices is empty array on error
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
		if (typingAudio) {
			typingAudio.pause();
			typingAudio.currentTime = 0;
		}
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

		if (typingAudio) {
			typingAudio.currentTime = 0;
			typingAudio.play().catch(() => {});
		}

		for (const sentence of sentences) {
			if (cancelled) break;
			await typeSentence(sentence);
		}

		if (typingAudio) {
			typingAudio.pause();
			typingAudio.currentTime = 0;
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

		if (choice.status) {
			// If it's a correct choice
			correctAudio.currentTime = 0;
			correctAudio.play().catch(() => {});
		} else {
			// If it's a wrong choice
			wrongAudio.currentTime = 0;
			wrongAudio.play().catch(() => {});
			wrongChoices.add(choice.id);
		}
	}

	async function goToNextStep() {
		// Modified to work without requiring a selected choice
		if (!currentStep) return;

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
		goto(`/skills/${quest.skill_slug}`);
	}
</script>

<div class="wrapper">
	<div class="container mt-5">
		{#if !started}
			<div class="text-center">
				{#if quest}
					<div class="title">{quest.title}</div>

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

							{#if selectedChoice?.status}
								<div class="next-button-container" transition:fade>
									{#if currentStep.success_step_id}
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
	</div>
</div>

<style>
	.title {
		font-size: 24px;
		color: #fff;
	}

	.wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		color: #fff;
	}

	.container {
		width: 100%;
		max-width: 700px;
	}

	:global(.questView .wrapper) {
		width: 100vw;
		position: absolute;
		left: 0;
	}

	:global(.questView header) {
		display: none;
	}

	.typewriter {
		white-space: pre-wrap;
		font-family: monospace;
		font-size: 1.2rem;
		color: #fff;
		cursor: default;
	}

	.typewriter.clickable {
		cursor: pointer;
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
		background-color: #98fb98 !important; /* Light green */
		border-color: #98fb98 !important;
		color: #000 !important;
	}

	.btn-danger {
		background-color: #ff6b6b !important; /* Softer red */
		border-color: #ff6b6b !important;
		color: #fff !important;
	}

	:global(.questView .wrapper) {
		background: #41295a;
		background: -webkit-linear-gradient(to right, #2f0743, #41295a);
		background-image: linear-gradient(to right, #2f0743, #41295a) !important;
	}

	:global(.questView .guide-btn, .guide) {
		display: none;
	}

	:global(.questView .nav-circle, .show-menu) {
		background-color: transparent !important;
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
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.reasoning-container.success {
		background-color: rgba(152, 251, 152, 0.15);
		border-left-color: #98fb98;
	}

	.reasoning-container.error {
		background-color: rgba(255, 107, 107, 0.15);
		border-left-color: #ff6b6b;
	}

	.choice-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none !important;
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
		background-color: #ffd700 !important; /* Gold color for finish */
		color: #000 !important;
	}

	.finish-btn:hover {
		background-color: #ffed4a !important;
	}
</style>
