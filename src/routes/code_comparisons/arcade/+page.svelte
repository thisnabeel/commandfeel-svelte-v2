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
		code_comparison_title: string;
		code_blocks: Array<{ content: string }>;
		tags?: Tag[];
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

	async function loadNewQuestion() {
		try {
			loading = true;
			showAnswer = false;
			userAnswer = '';
			currentQuestion = await Api.get('/code_comparisons/arcade');
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
				.sort(() => Math.random() - 0.5)
				.slice(0, 4); // Take only 4 random options
		} catch (err) {
			console.error('Failed to load taggables:', err);
			options = [];
		} finally {
			loadingOptions = false;
		}
	}

	function checkAnswer(selectedTitle: string) {
		userAnswer = selectedTitle;
		showAnswer = true;
		// Here you could implement actual answer checking logic
	}

	function nextQuestion() {
		loadNewQuestion();
	}

	function switchCodeTab(index: number) {
		activeCodeTab = index;
	}

	onMount(loadNewQuestion);
</script>

<div class="wrapper" in:fade>
	<Container class="py-4">
		{#if error}
			<div class="alert alert-danger" role="alert">
				<p class="font-medium">{error}</p>
			</div>
		{/if}

		<Card class="mb-4">
			<CardHeader>
				<div class="d-flex justify-content-between align-items-center">
					<h2 class="mb-0">SOLID Principles Arcade</h2>
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
										Code Block {i + 1}
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
												outline
												color="primary"
												class="text-start"
												on:click={() => checkAnswer(option.title)}
											>
												{option.title}
												<!-- <small class="text-muted ms-2">({option.type})</small> -->
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
										/>
									</FormGroup>
									<Button type="submit" color="primary">Check Answer</Button>
								</Form>
							{/if}
							<Button color="secondary" class="mt-3" on:click={nextQuestion}>Skip</Button>
						{:else}
							<div class="answer-section mt-4">
								<div class="alert alert-info">
									<h4 class="alert-heading">Explanation</h4>
									<p>
										This example demonstrates the {currentQuestion.code_comparison_title}. The first
										block shows code that violates the principle, while the second block shows a
										refactored version that follows it.
									</p>
								</div>
								<Button color="primary" on:click={nextQuestion}>Next Question</Button>
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

	@media (max-width: 768px) {
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
</style>
