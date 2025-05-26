<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { fade, fly } from 'svelte/transition';

	let arcadeData = [];
	let currentWonderIndex = 0;
	let currentQuizIndex = 0;
	let selectedChoice = null;
	let showFeedback = false;
	let score = 0;
	let totalQuestions = 0;

	onMount(async () => {
		try {
			const response = await Api.get('/wonders/arcade.json');
			// Filter out wonders that don't have any quizzes
			arcadeData = response.filter((wonder) => wonder.quizzes && wonder.quizzes.length > 0);
			totalQuestions = arcadeData.reduce((total, wonder) => total + wonder.quizzes.length, 0);
		} catch (error) {
			console.error('Failed to fetch arcade data:', error);
		}
	});

	$: currentWonder = arcadeData[currentWonderIndex]?.wonder || null;
	$: currentQuiz = arcadeData[currentWonderIndex]?.quizzes[currentQuizIndex] || null;

	function handleChoice(choice) {
		selectedChoice = choice;
		showFeedback = true;
		if (choice.correct) {
			score++;
		}
	}

	function nextQuestion() {
		showFeedback = false;
		selectedChoice = null;

		// Move to next question or wonder
		if (currentQuizIndex < arcadeData[currentWonderIndex].quizzes.length - 1) {
			currentQuizIndex++;
		} else {
			// Move to next wonder with quizzes
			let nextWonderIndex = currentWonderIndex + 1;

			// If we've reached the end, loop back to start
			if (nextWonderIndex >= arcadeData.length) {
				nextWonderIndex = 0;
			}

			currentWonderIndex = nextWonderIndex;
			currentQuizIndex = 0;
		}
	}
</script>

<div class="arcade-container">
	{#if arcadeData.length > 0 && currentWonder}
		<div class="score-display" transition:fade>
			Score: {score} / {totalQuestions}
		</div>

		<div class="wonder-title" transition:fade>
			<h2>{currentWonder.title}</h2>
		</div>

		{#if currentQuiz}
			<div class="quiz-container" in:fly={{ y: 50, duration: 500 }}>
				<div class="question">
					<h3>{currentQuiz.question}</h3>
				</div>

				<div class="choices">
					{#each currentQuiz.quiz_choices as choice}
						<button
							class="choice-btn"
							class:selected={selectedChoice === choice}
							class:correct={showFeedback && choice.correct}
							class:incorrect={showFeedback && selectedChoice === choice && !choice.correct}
							on:click={() => !showFeedback && handleChoice(choice)}
							disabled={showFeedback}
						>
							{choice.body}
						</button>
					{/each}
				</div>

				{#if showFeedback}
					<div class="feedback" transition:fade>
						<div class="result">
							{selectedChoice.correct ? '✅ Correct!' : '❌ Incorrect'}
						</div>
						<div class="reasoning">
							{selectedChoice.reasoning}
						</div>
						<button class="next-btn" on:click={nextQuestion}>Next Question →</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="loading">No questions available for this wonder.</div>
		{/if}
	{:else}
		<div class="loading">Loading arcade questions...</div>
	{/if}
</div>

<style>
	.arcade-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.score-display {
		position: fixed;
		top: 1rem;
		right: 1rem;
		background: #416fff;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: bold;
	}

	.wonder-title {
		text-align: center;
		color: #416fff;
	}

	.wonder-title h2 {
		font-size: 2rem;
		margin: 0;
	}

	.quiz-container {
		background: white;
		padding: 2rem;
		border-radius: 10px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.question h3 {
		font-size: 1.5rem;
		margin: 0 0 2rem 0;
		color: #333;
	}

	.choices {
		display: grid;
		gap: 1rem;
	}

	.choice-btn {
		padding: 1rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		background: white;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.choice-btn:hover:not(:disabled) {
		border-color: #416fff;
		transform: translateY(-2px);
	}

	.choice-btn.selected {
		border-color: #416fff;
	}

	.choice-btn.correct {
		border-color: #4caf50;
		background: #4caf50;
		color: white;
	}

	.choice-btn.incorrect {
		border-color: #f44336;
		background: #f44336;
		color: white;
	}

	.feedback {
		margin-top: 2rem;
		padding: 1rem;
		border-radius: 8px;
		background: #f5f5f5;
	}

	.result {
		font-size: 1.2rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}

	.reasoning {
		color: #666;
		margin-bottom: 1rem;
	}

	.next-btn {
		background: #416fff;
		color: white;
		border: none;
		padding: 0.8rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s;
	}

	.next-btn:hover {
		background: #3257d3;
	}

	.loading {
		text-align: center;
		color: #666;
		font-size: 1.2rem;
	}
</style>
