<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import {
		Container,
		Row,
		Col,
		Form,
		FormGroup,
		Input,
		Button,
		Card,
		CardBody,
		CardHeader
	} from 'sveltestrap';
	import CodeEditor from '$lib/components/CodeEditor/CodeEditor.svelte';
	import Sortable from 'sortablejs';
	import { inview } from '$lib/actions/inview';

	interface CodeBlock {
		id: number;
		content: string;
	}

	interface CodeComparison {
		id: number;
		title: string;
		code_blocks?: CodeBlock[];
		loading_blocks?: boolean;
	}

	interface SortableEvent {
		target: HTMLElement;
	}

	let codeComparisons: CodeComparison[] = [];
	let newComparison = { title: '' };
	let loading = true;
	let error = '';
	let editingComparison: CodeComparison | null = null;

	// For code blocks
	let newCodeBlock = { content: '' };
	let selectedComparisonId: number | null = null;

	// For tags
	let tagSearchTerms = {};
	let tagSearchResults = {};
	let comparisonTags = {};
	let showDropdowns = {};

	// Add this with other state variables at the top
	let generatingExample = false;

	async function fetchComparisons() {
		try {
			codeComparisons = await Api.get('/code_comparisons');
			loading = false;
		} catch (err: any) {
			error = err?.message || 'Failed to fetch code comparisons';
			loading = false;
		}
	}

	async function createComparison() {
		try {
			const createdComparison = await Api.post('/code_comparisons', {
				code_comparison: newComparison
			});
			codeComparisons = [...codeComparisons, createdComparison];
			newComparison = { title: '' };
		} catch (err: any) {
			error = err?.message || 'Failed to create code comparison';
		}
	}

	async function updateComparison(comparison: CodeComparison) {
		if (!comparison) return;

		try {
			const updatedComparison = await Api.put(`/code_comparisons/${comparison.id}`, {
				code_comparison: comparison
			});
			codeComparisons = codeComparisons.map((c) =>
				c.id === updatedComparison.id ? updatedComparison : c
			);
			editingComparison = null;
		} catch (err: any) {
			error = err?.message || 'Failed to update code comparison';
		}
	}

	async function deleteComparison(id: number) {
		if (!confirm('Are you sure you want to delete this code comparison?')) return;

		try {
			await Api.delete(`/code_comparisons/${id}`);
			codeComparisons = codeComparisons.filter((c) => c.id !== id);
		} catch (err: any) {
			error = err?.message || 'Failed to delete code comparison';
		}
	}

	async function addCodeBlock(comparisonId: number) {
		try {
			const response = await Api.post(`/code_comparisons/${comparisonId}/code_blocks`, {
				code_block: newCodeBlock
			});

			// Create a new code block object from the response
			const newBlock = {
				id: response.id,
				content: response.content,
				position: response.position
			};

			// Update the comparison directly instead of fetching again
			codeComparisons = codeComparisons.map((c) => {
				if (c.id === comparisonId) {
					return {
						...c,
						code_blocks: [...(c.code_blocks || []), newBlock]
					};
				}
				return c;
			});

			// Reset the new code block state with a new object
			newCodeBlock = { content: '' };
		} catch (err: any) {
			error = err?.message || 'Failed to add code block';
		}
	}

	async function reorderCodeBlocks(comparisonId: number, codeBlockIds: number[]) {
		try {
			await Api.post(`/code_comparisons/${comparisonId}/code_blocks/reorder`, {
				code_block_ids: codeBlockIds
			});
			const updatedComparison = await Api.get(`/code_comparisons/${comparisonId}`);
			codeComparisons = codeComparisons.map((c) =>
				c.id === updatedComparison.id ? updatedComparison : c
			);
		} catch (err: any) {
			error = err?.message || 'Failed to reorder code blocks';
		}
	}

	async function deleteCodeBlock(comparisonId: number, blockId: number) {
		if (!confirm('Are you sure you want to delete this code block?')) return;

		try {
			await Api.delete(`/code_blocks/${blockId}`);

			// Update the local state while preserving other code blocks
			codeComparisons = codeComparisons.map((comparison) => {
				if (comparison.id === comparisonId) {
					return {
						...comparison,
						code_blocks: comparison.code_blocks?.filter((block) => block.id !== blockId)
					};
				}
				return comparison;
			});
		} catch (err: any) {
			error = err?.message || 'Failed to delete code block';
		}
	}

	function initSortable(node: HTMLElement, comparisonId: number) {
		Sortable.create(node, {
			animation: 150,
			onEnd: async (evt: SortableEvent) => {
				const codeBlocks = Array.from(evt.target.children as HTMLCollectionOf<HTMLElement>).map(
					(el) => parseInt(el.dataset.id || '0')
				);
				await reorderCodeBlocks(comparisonId, codeBlocks);
			}
		});

		return {
			destroy() {
				// Cleanup if needed
			}
		};
	}

	async function loadCodeBlocks(comparison: CodeComparison) {
		if (comparison.code_blocks || comparison.loading_blocks) return;

		try {
			comparison.loading_blocks = true;
			const blocks = await Api.get(`/code_comparisons/${comparison.id}/code_blocks`);

			codeComparisons = codeComparisons.map((c) => {
				if (c.id === comparison.id) {
					return {
						...c,
						code_blocks: blocks,
						loading_blocks: false
					};
				}
				return c;
			});
		} catch (err: any) {
			error = err?.message || 'Failed to load code blocks';
			comparison.loading_blocks = false;
		}
	}

	async function generateSolidExample() {
		if (generatingExample) return;

		try {
			generatingExample = true;
			const response = await Api.post('/code_comparisons/generate_solid_comparison');
			const createdComparison = await Api.post('/code_comparisons', {
				code_comparison: { title: response.code_comparison_title }
			});

			// Add the code blocks
			const blocks = [];
			for (const block of response.code_blocks) {
				const createdBlock = await Api.post(
					`/code_comparisons/${createdComparison.id}/code_blocks`,
					{
						code_block: block
					}
				);
				blocks.push(createdBlock);
			}

			// Add the new comparison to the list with the created blocks
			codeComparisons = [
				...codeComparisons,
				{
					...createdComparison,
					code_blocks: blocks
				}
			];
		} catch (err: any) {
			error = err?.message || 'Failed to generate SOLID example';
		} finally {
			generatingExample = false;
		}
	}

	async function loadTags(comparisonId) {
		try {
			comparisonTags[comparisonId] = await Api.get(`/code_comparisons/${comparisonId}/tags`);
		} catch (err) {
			console.error('Failed to load tags:', err);
		}
	}

	async function searchTags(comparisonId) {
		const searchTerm = tagSearchTerms[comparisonId];
		if (!searchTerm || searchTerm.length < 2) {
			tagSearchResults[comparisonId] = [];
			showDropdowns[comparisonId] = false;
			return;
		}

		try {
			tagSearchResults[comparisonId] = await Api.get(`/tags/search?q=${searchTerm}`);
			showDropdowns[comparisonId] = true;
		} catch (err) {
			console.error('Failed to search tags:', err);
			tagSearchResults[comparisonId] = [];
			showDropdowns[comparisonId] = false;
		}
	}

	async function addTag(comparisonId, tag) {
		try {
			await Api.post(`/code_comparisons/${comparisonId}/tags`, { tag_id: tag.id });
			comparisonTags[comparisonId] = [...(comparisonTags[comparisonId] || []), tag];
			tagSearchTerms[comparisonId] = '';
			showDropdowns[comparisonId] = false;
		} catch (err) {
			console.error('Failed to add tag:', err);
		}
	}

	async function removeTag(comparisonId, tagId) {
		try {
			await Api.delete(`/code_comparisons/${comparisonId}/tags/${tagId}`);
			comparisonTags[comparisonId] = comparisonTags[comparisonId].filter((t) => t.id !== tagId);
		} catch (err) {
			console.error('Failed to remove tag:', err);
		}
	}

	$: {
		Object.keys(tagSearchTerms).forEach((comparisonId) => {
			if (tagSearchTerms[comparisonId]?.length >= 2) {
				searchTags(comparisonId);
			}
		});
	}

	onMount(fetchComparisons);
</script>

<div class="wrapper" in:fade>
	<Container class="py-4">
		{#if error}
			<div class="alert alert-danger" role="alert">
				<p class="font-medium">{error}</p>
			</div>
		{/if}

		{#if $user?.admin}
			<!-- Create New Code Comparison Form -->
			<Card class="mb-4">
				<CardHeader>
					<div class="d-flex justify-content-between align-items-center">
						<h2 class="mb-0">Create New Code Comparison</h2>
						<Button
							color="warning"
							on:click={generateSolidExample}
							title="Generate SOLID Principle Example"
							disabled={generatingExample}
						>
							{#if generatingExample}
								<div class="spinner-border spinner-border-sm me-2" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
								Generating...
							{:else}
								<i class="fa fa-bolt" /> Generate Example
							{/if}
						</Button>
					</div>
				</CardHeader>
				<CardBody>
					<Form
						on:submit={(e) => {
							e.preventDefault();
							createComparison();
						}}
					>
						<FormGroup>
							<label for="title">Title</label>
							<Input
								type="text"
								bind:value={newComparison.title}
								placeholder="Enter comparison title..."
								required
							/>
						</FormGroup>
						<Button type="submit" color="primary" class="w-100">Create Comparison</Button>
					</Form>
				</CardBody>
			</Card>
		{/if}

		<!-- Code Comparisons List -->
		<Card>
			<CardHeader>
				<h2 class="mb-0">Code Comparisons</h2>
			</CardHeader>
			<CardBody>
				{#if loading}
					<div class="d-flex justify-content-center py-4">
						<div class="spinner-border text-primary" role="status">
							<span class="visually-hidden">Loading...</span>
						</div>
					</div>
				{:else if codeComparisons.length === 0}
					<p class="text-muted py-4 text-center">No code comparisons found.</p>
				{:else}
					<div class="comparisons-list">
						{#each codeComparisons as comparison (comparison.id)}
							<Card class="mb-3">
								<CardBody>
									<div
										use:inview
										on:inview={() => {
											loadCodeBlocks(comparison);
											loadTags(comparison.id);
										}}
									>
										{#if editingComparison?.id === comparison.id && $user?.admin}
											<Form
												on:submit={(e) => {
													e.preventDefault();
													editingComparison && updateComparison(editingComparison);
												}}
											>
												<FormGroup>
													<Input
														type="text"
														bind:value={editingComparison.title}
														placeholder="Title"
														required
													/>
												</FormGroup>
												<div class="d-flex gap-2">
													<Button type="submit" color="success">Save Changes</Button>
													<Button color="secondary" on:click={() => (editingComparison = null)}>
														Cancel
													</Button>
												</div>
											</Form>
										{:else}
											<div class="d-flex justify-content-between align-items-start mb-3">
												<div>
													<h3 class="mb-2">{comparison.title}</h3>
													{#if comparisonTags[comparison.id]}
														<div class="tags-section">
															{#each comparisonTags[comparison.id] as tag}
																<span class="tag">
																	{tag.title}
																	{#if $user?.admin}
																		<button
																			class="remove-tag"
																			on:click={() => removeTag(comparison.id, tag.id)}
																		>
																			×
																		</button>
																	{/if}
																</span>
															{/each}
															{#if $user?.admin}
																<div class="tag-search">
																	<input
																		type="text"
																		bind:value={tagSearchTerms[comparison.id]}
																		placeholder="Add tag..."
																		class="tag-input"
																	/>
																	{#if showDropdowns[comparison.id] && tagSearchResults[comparison.id]?.length > 0}
																		<div class="dropdown">
																			{#each tagSearchResults[comparison.id] as result}
																				<div
																					class="dropdown-item"
																					on:click={() => addTag(comparison.id, result)}
																				>
																					{result.title}
																				</div>
																			{/each}
																		</div>
																	{/if}
																</div>
															{/if}
														</div>
													{/if}
												</div>
												{#if $user?.admin}
													<div class="d-flex gap-2">
														<Button
															color="primary"
															class="btn-sm"
															on:click={() => (editingComparison = { ...comparison })}
														>
															<i class="fa fa-edit" />
														</Button>
														<Button
															color="danger"
															class="btn-sm"
															on:click={() => deleteComparison(comparison.id)}
														>
															<i class="fa fa-trash" />
														</Button>
													</div>
												{/if}
											</div>
										{/if}

										<!-- Code Blocks -->
										{#if comparison.loading_blocks}
											<div class="py-3 text-center">
												<div class="spinner-border text-primary" role="status">
													<span class="visually-hidden">Loading...</span>
												</div>
											</div>
										{:else if (comparison.code_blocks || []).length > 0}
											<div
												class="code-blocks-list {comparison.code_blocks?.length === 2
													? 'side-by-side'
													: ''}"
												use:initSortable={comparison.id}
											>
												{#each comparison.code_blocks || [] as block (block.id)}
													<div class="code-block mb-3" data-id={block.id}>
														<CodeEditor
															height={`${block.content.split('\n').length * 22 + 16}px`}
															defaultLanguage="javascript"
															defaultValue={block.content}
															wordWrap="on"
															scrollBeyondLastLine={false}
															options={{
																readOnly: true,
																minimap: { enabled: false },
																lineNumbers: 'on',
																lineHeight: 22,
																padding: { top: 8, bottom: 8 },
																scrollbar: {
																	vertical: 'hidden',
																	horizontal: 'hidden'
																}
															}}
														/>
														{#if $user?.admin}
															<div class="code-block-actions">
																<div class="drag-handle">
																	<i class="fa fa-grip-vertical" />
																</div>
																<button
																	class="delete-block-btn"
																	on:click={() => deleteCodeBlock(comparison.id, block.id)}
																	title="Delete code block"
																>
																	<i class="fa fa-times" />
																</button>
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{/if}

										{#if $user?.admin}
											<div class="add-code-block mt-3">
												<h4 class="mb-3">Add Code Block</h4>
												<Form
													on:submit={(e) => {
														e.preventDefault();
														addCodeBlock(comparison.id);
													}}
												>
													<FormGroup>
														<CodeEditor
															height="200px"
															defaultLanguage="javascript"
															defaultValue=""
															wordWrap="on"
															scrollBeyondLastLine={false}
															onChange={(value) => {
																newCodeBlock = { content: value };
															}}
															options={{
																minimap: { enabled: false },
																lineNumbers: 'on',
																lineHeight: 22,
																padding: { top: 8, bottom: 8 }
															}}
														/>
													</FormGroup>
													<Button type="submit" color="primary">Add Code Block</Button>
												</Form>
											</div>
										{/if}
									</div></CardBody
								>
							</Card>
						{/each}
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

	:global(.card) {
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(.card-header) {
		background-color: transparent;
		border-bottom: 1px solid #eee;
		padding: 1.5rem;
	}

	:global(.card-body) {
		padding: 1.5rem;
	}

	:global(.btn-primary) {
		background-color: #416fff;
		border-color: #416fff;
	}

	:global(.btn-primary:hover) {
		background-color: #3257d3;
		border-color: #3257d3;
	}

	.gap-2 {
		gap: 0.5rem;
	}

	.code-blocks-list {
		position: relative;
	}

	.code-blocks-list.side-by-side {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 768px) {
		.code-blocks-list.side-by-side {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}

	.code-block {
		position: relative;
		border: 1px solid #eee;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.code-blocks-list.side-by-side .code-block {
		margin-bottom: 0;
	}

	:global(.code-block .editor) {
		padding: 0;
		background: #1e1e1e;
		border-radius: 4px;
		overflow: hidden;
	}

	:global(.monaco-editor) {
		padding-top: 0;
		padding-bottom: 0;
	}

	:global(.monaco-editor .margin) {
		background-color: #1e1e1e !important;
	}

	:global(.monaco-editor .line-numbers) {
		color: #666 !important;
	}

	.code-block-actions {
		position: absolute;
		top: 0;
		left: -24px;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 8px 0;
	}

	.drag-handle {
		cursor: move;
		color: #666;
	}

	.delete-block-btn {
		background: none;
		border: none;
		color: #dc3545;
		cursor: pointer;
		padding: 4px;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.delete-block-btn:hover {
		opacity: 1;
	}

	@media (max-width: 480px) {
		.wrapper {
			padding: 4px;
		}
	}

	.tags-section {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		margin-bottom: 1rem;
	}

	.tag {
		background: #e9ecef;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.9em;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.remove-tag {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font-size: 1.2em;
		line-height: 1;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.remove-tag:hover {
		opacity: 1;
	}

	.tag-search {
		position: relative;
		min-width: 150px;
	}

	.tag-input {
		width: 100%;
		padding: 4px 8px;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 0.9em;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #ced4da;
		border-radius: 4px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 1000;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.dropdown-item {
		padding: 8px;
		cursor: pointer;
	}

	.dropdown-item:hover {
		background: #f8f9fa;
	}
</style>
