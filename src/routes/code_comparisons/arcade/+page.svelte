<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Api from '$lib/api/api';
	import {
		Container,
		Row,
		Col,
		Button,
		Card,
		CardBody,
		CardHeader,
		Form,
		FormGroup,
		Input
	} from 'sveltestrap';
	import CodeEditor from '$lib/components/CodeEditor/CodeEditor.svelte';

	interface Tag {
		id: number;
		title: string;
	}

	interface Taggable {
		id: number;
		title: string;
		type: string;
		description?: string;
	}

	interface CurrentQuestion {
		id: number;
		code_comparison_title: string;
		code_blocks: Array<{ content: string }>;
		tags?: Tag[];
		answerable?: {
			id: number;
			title: string;
			description?: string | null;
		};
	}

	let loading = true;
	let error = '';
	let currentQuestion: CurrentQuestion | null = null;
	let userAnswer = '';
	let showAnswer = false;
	let streak = 0;
	let options: Taggable[] = [];
	let loadingOptions = false;
	let activeCodeTab = 0;
	let selectedOption: string | null = null;
	let isCorrect: boolean | null = null;
	let answerSubmitted = false;
	let usedComparisonIds: number[] = [];

	async function loadNewQuestion() {
		try {
			loading = true;
			selectedOption = null;
			isCorrect = null;
			answerSubmitted = false;
			userAnswer = '';
			currentQuestion = await Api.get(`/code_comparisons/arcade?used_ids=${usedComparisonIds}`);
			usedComparisonIds = [...usedComparisonIds, currentQuestion?.id];
			console.log({ usedComparisonIds });

			if (currentQuestion?.tags) {
				await loadTaggables(currentQuestion.tags[0].id);
			}
		} catch (err: any) {
			error = err?.message || 'Failed to load question';
		} finally {
			loading = false;
		}
	}

	async function loadTaggables(tagId: number) {
		try {
			loadingOptions = true;
			const response = await Api.get(`/tags/${tagId}/taggables`);
			// Filter only Wonder and Skill items and shuffle them
			options = response.items
				.filter((item: Taggable) => item.type === 'Wonder' || item.type === 'Skill')
				.sort(() => Math.random() - 0.5); // Shuffle the options
		} catch (err) {
			console.error('Failed to load taggables:', err);
			options = [];
		} finally {
			loadingOptions = false;
		}
	}

	function checkAnswer(selectedTitle: string) {
		if (answerSubmitted) return; // Prevent further clicks after answer is submitted

		selectedOption = selectedTitle;
		isCorrect = currentQuestion?.answerable?.title === selectedTitle;
		answerSubmitted = true;

		if (isCorrect) {
			streak++;
			// Add current question ID to used IDs when answered correctly
		} else {
			streak = 0;
		}
	}

	function nextQuestion() {
		selectedOption = null;
		isCorrect = null;
		answerSubmitted = false;
		loadNewQuestion();
	}

	function switchCodeTab(index: number) {
		activeCodeTab = index;
	}

	onMount(loadNewQuestion);
</script>

<div class="wrapper" in:fade>
	<Container class="cont-wrapper py-4">
		{#if error}
			<div class="alert alert-danger" role="alert">
				<p class="font-medium">{error}</p>
			</div>
		{/if}

		<Card class="mb-4">
			<CardHeader>
				<div class="d-flex justify-content-between align-items-center">
					<h2 class="mb-0">Arcade</h2>
					<div class="streak">Streak: {streak}</div>
				</div>
			</CardHeader>
			<CardBody>
				{#if loading}
					<div class="py-5 text-center">
						<div class="spinner-border text-primary" role="status">
							<span class="visually-hidden">Loading...</span>
						</div>
					</div>
				{:else if currentQuestion}
					<div class="question-container">
						<!-- <h3 class="mb-4">{currentQuestion.code_comparison_title}</h3> -->

						<div class="code-blocks-container">
							<div class="mobile-nav">
								{#each currentQuestion.code_blocks as _, i}
									<button
										class="mobile-tab"
										class:active={activeCodeTab === i}
										on:click={() => switchCodeTab(i)}
									>
										{i === 0 ? 'Before' : 'After'}
									</button>
								{/each}
							</div>
							{#each currentQuestion.code_blocks as block, i}
								<div class="code-block" class:active-block={activeCodeTab === i}>
									<CodeEditor
										height={`${block.content.split('\n').length * 22 + 32}px`}
										defaultLanguage="ruby"
										defaultValue={block.content}
										wordWrap="on"
										scrollBeyondLastLine={false}
										options={{
											readOnly: true,
											minimap: { enabled: false },
											lineNumbers: 'on',
											lineHeight: 22,
											padding: { top: 16, bottom: 16 },
											scrollbar: {
												vertical: 'hidden',
												horizontal: 'auto'
											},
											fixedOverflowWidgets: true
										}}
									/>
								</div>
							{/each}
						</div>

						{#if !showAnswer}
							{#if loadingOptions}
								<div class="mt-4 text-center">
									<div class="spinner-border text-primary" role="status">
										<span class="visually-hidden">Loading options...</span>
									</div>
								</div>
							{:else if options.length > 0}
								<div class="options-container mt-4">
									<h4 class="mb-3">Which concept is being demonstrated?</h4>
									<div class="d-grid gap-2">
										{#each options as option}
											<Button
												outline={!answerSubmitted ||
													(selectedOption !== option.title &&
														option.title !== currentQuestion?.answerable?.title)}
												color={answerSubmitted
													? option.title === currentQuestion?.answerable?.title
														? 'success'
														: selectedOption === option.title
															? 'danger'
															: 'primary'
													: 'primary'}
												class="text-start"
												on:click={() => checkAnswer(option.title)}
												disabled={answerSubmitted}
											>
												{option.title}
												{#if answerSubmitted && (option.title === currentQuestion?.answerable?.title || option.title === selectedOption)}
													<i
														class="fa {option.title === currentQuestion?.answerable?.title
															? 'fa-check'
															: 'fa-times'} ms-2"
														aria-hidden="true"
													/>
												{/if}
											</Button>
										{/each}
									</div>
								</div>
							{:else}
								<Form
									class="mt-4"
									on:submit={(e) => {
										e.preventDefault();
										checkAnswer(userAnswer);
									}}
								>
									<FormGroup>
										<Input
											type="text"
											bind:value={userAnswer}
											placeholder="Which SOLID principle is being demonstrated?"
											required
											disabled={answerSubmitted}
										/>
									</FormGroup>
									<Button type="submit" color="primary" disabled={answerSubmitted}
										>Check Answer</Button
									>
								</Form>
							{/if}
							<div class="d-flex mt-3 gap-2">
								{#if answerSubmitted}
									<Button color="primary" on:click={nextQuestion}>Next Question</Button>
								{/if}
							</div>
						{:else}
							<div class="answer-section mt-4">
								<div class="alert {isCorrect ? 'alert-success' : 'alert-danger'}">
									<h4 class="alert-heading">{isCorrect ? 'Correct!' : 'Not quite right'}</h4>
									<p>
										This example demonstrates the {currentQuestion?.answerable?.title}. The first
										block shows code that violates the principle, while the second block shows a
										refactored version that follows it.
									</p>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</CardBody>
		</Card>
	</Container>
</div>

<style>
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		position: relative;
	}

	.streak {
		font-size: 1.2rem;
		font-weight: bold;
		color: #416fff;
	}

	.code-blocks-container {
		margin: 1rem 0;
	}

	.mobile-nav {
		display: none;
		margin-bottom: 1rem;
	}

	.mobile-tab {
		flex: 1;
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		padding: 12px;
		font-size: 1rem;
		cursor: pointer;
		text-align: center;
	}

	.mobile-tab.active {
		background: #416fff;
		color: white;
		border-color: #416fff;
	}

	.code-block {
		border: 1px solid #dee2e6;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 1rem;
		background: #1e1e1e;
	}

	.options-container {
		max-width: 600px;
		margin: 0 auto;
	}

	:global(.options-container .btn) {
		text-align: left !important;
		padding: 1rem;
		font-size: 1.1rem;
		border-radius: 8px;
	}

	:global(.options-container .btn:hover) {
		background-color: #e9ecef;
	}

	.text-muted {
		color: #6c757d;
	}

	.ms-2 {
		margin-left: 0.5rem;
	}

	:global(.monaco-editor .margin) {
		background: #1e1e1e !important;
	}

	:global(.monaco-editor) {
		padding: 0 !important;
	}

	.code-block :global(.editor) {
		border: none;
	}

	@media (max-width: 768px) {
		:global(.cont-wrapper) {
			padding: 0 !important;
		}
		.mobile-nav {
			display: flex;
			gap: 4px;
		}

		.code-blocks-container {
			margin: 0;
		}

		.code-block {
			display: none;
			margin: 0;
		}

		.code-block.active-block {
			display: block;
		}

		.wrapper {
			padding: 0;
		}
	}

	@media (min-width: 769px) {
		.code-blocks-container {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1.5rem;
		}
	}

	:global(.options-container .btn .fa) {
		float: right;
	}

	:global(.options-container .btn-success) {
		background-color: #28a745;
		color: white;
		border-color: #28a745;
	}

	:global(.options-container .btn-danger) {
		background-color: #dc3545;
		color: white;
		border-color: #dc3545;
	}
</style>
