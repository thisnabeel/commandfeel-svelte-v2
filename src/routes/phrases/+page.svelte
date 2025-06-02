<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Api from '$lib/api/api.js';
	import { inview } from 'svelte-inview';
	import {
		Container,
		Row,
		Col,
		Form,
		FormGroup,
		Input,
		Button,
		Spinner,
		Card,
		CardBody,
		CardHeader,
		Collapse
	} from 'sveltestrap';

	let phrases = [];
	let newPhrase = { body: '', role: '' };
	let editingPhrase = null;
	let loading = true;
	let error = '';
	let suggestionsMap = {};
	let phraseLinksMap = {};

	async function fetchPhrases() {
		try {
			phrases = await Api.get('/phrases.json');
			loading = false;
		} catch (err) {
			error = err?.message || 'Failed to fetch phrases';
			loading = false;
		}
	}

	async function createPhrase() {
		try {
			const createdPhrase = await Api.post('/phrases.json', newPhrase);
			phrases = [...phrases, createdPhrase];
			newPhrase = { body: '', role: '' };
		} catch (err) {
			error = err?.message || 'Failed to create phrase';
		}
	}

	async function updatePhrase(phrase) {
		if (!phrase) return;

		try {
			const updatedPhrase = await Api.put(`/phrases/${phrase.id}.json`, phrase);
			phrases = phrases.map((p) => (p.id === updatedPhrase.id ? updatedPhrase : p));
			editingPhrase = null;
		} catch (err) {
			error = err?.message || 'Failed to update phrase';
		}
	}

	async function deletePhrase(id) {
		if (!confirm('Are you sure you want to delete this phrase?')) return;

		try {
			await Api.delete(`/phrases/${id}.json`);
			phrases = phrases.filter((p) => p.id !== id);
		} catch (err) {
			error = err?.message || 'Failed to delete phrase';
		}
	}

	async function suggestTechnologies(phraseId) {
		try {
			const response = await Api.post(`/phrases/${phraseId}/suggest_technologies`);
			suggestionsMap[phraseId] = response.suggestions;
		} catch (err) {
			error = err?.message || 'Failed to get suggestions';
		}
	}

	async function fetchPhraseLinks(phraseId) {
		if (phraseLinksMap[phraseId]) return;

		try {
			const response = await Api.get(`/phrases/${phraseId}`);
			phraseLinksMap[phraseId] = response.phrase_links;
			phraseLinksMap = phraseLinksMap;
		} catch (err) {
			console.error('Failed to fetch phrase links:', err);
		}
	}

	const inviewOptions = {
		unobserveOnEnter: true,
		rootMargin: '50px'
	};

	onMount(fetchPhrases);
</script>

<div class="wrapper" in:fade>
	<Container class="py-4">
		<div class="title mb-4 text-center">
			<h1 class="space-grotesk-heading">Phrase Management</h1>
		</div>

		{#if error}
			<div class="alert alert-danger" role="alert">
				<p class="font-medium">{error}</p>
			</div>
		{/if}

		<!-- Create New Phrase Form -->
		<Card class="mb-4">
			<CardHeader>
				<h2 class="mb-0">Create New Phrase</h2>
			</CardHeader>
			<CardBody>
				<Form
					on:submit={(e) => {
						e.preventDefault();
						createPhrase();
					}}
				>
					<FormGroup>
						<label for="body">Body</label>
						<Input
							type="textarea"
							id="body"
							bind:value={newPhrase.body}
							placeholder="Enter your phrase here..."
							rows="4"
							required
						/>
					</FormGroup>
					<FormGroup>
						<label for="role">Role</label>
						<Input
							type="text"
							id="role"
							bind:value={newPhrase.role}
							placeholder="Enter role (optional)"
						/>
					</FormGroup>
					<Button color="primary" type="submit" class="w-100">Create Phrase</Button>
				</Form>
			</CardBody>
		</Card>

		<!-- Phrases List -->
		<Card>
			<CardHeader>
				<h2 class="mb-0">Phrases List</h2>
			</CardHeader>
			<CardBody>
				{#if loading}
					<div class="d-flex justify-content-center py-4">
						<Spinner color="primary" />
					</div>
				{:else if phrases.length === 0}
					<p class="text-muted py-4 text-center">No phrases found.</p>
				{:else}
					<div class="phrases-list">
						{#each phrases as phrase (phrase.id)}
							<div use:inview={inviewOptions} on:inview_enter={() => fetchPhraseLinks(phrase.id)}>
								<Card class="mb-3">
									<CardBody>
										{#if editingPhrase?.id === phrase.id}
											<Form
												on:submit={(e) => {
													e.preventDefault();
													editingPhrase && updatePhrase(editingPhrase);
												}}
											>
												<FormGroup>
													<Input
														type="textarea"
														bind:value={editingPhrase.body}
														rows="3"
														required
													/>
												</FormGroup>
												<FormGroup>
													<Input type="text" bind:value={editingPhrase.role} placeholder="Role" />
												</FormGroup>
												<div class="d-flex gap-2">
													<Button color="success" type="submit">Save Changes</Button>
													<Button color="secondary" on:click={() => (editingPhrase = null)}>
														Cancel
													</Button>
												</div>
											</Form>
										{:else}
											<div class="d-flex justify-content-between align-items-start mb-3">
												<div>
													<p class="lead mb-2">{phrase.body}</p>
													<p class="text-muted small">Role: {phrase.role || 'Not specified'}</p>
												</div>
												<div class="d-flex gap-2">
													<Button
														color="warning"
														class="btn-sm"
														on:click={() => suggestTechnologies(phrase.id)}
													>
														<i class="fa fa-bolt" />
													</Button>
													<Button
														color="primary"
														class="btn-sm"
														on:click={() => (editingPhrase = { ...phrase })}
													>
														<i class="fa fa-edit" />
													</Button>
													<Button
														color="danger"
														class="btn-sm"
														on:click={() => deletePhrase(phrase.id)}
													>
														<i class="fa fa-trash" />
													</Button>
												</div>
											</div>

											<!-- Display Phrase Links -->
											{#if phraseLinksMap[phrase.id]}
												<div class="phrase-links mt-3" transition:fade>
													<h5 class="mb-3">Linked Technologies</h5>
													{#each phraseLinksMap[phrase.id] as link}
														<div class="suggestion-item mb-2">
															<div class="d-flex justify-content-between">
																<strong>{link.title}</strong>
																<span class="badge bg-secondary">{link.category}</span>
															</div>
															<p class="text-muted small mb-0">{link.explanation}</p>
														</div>
													{/each}
												</div>
											{/if}

											<!-- Display Suggestions -->
											{#if suggestionsMap[phrase.id]}
												<div class="suggestions-list mt-3" transition:fade>
													<h5 class="mb-3">Suggested Technologies</h5>
													{#each suggestionsMap[phrase.id] as suggestion}
														<div class="suggestion-item mb-2">
															<div class="d-flex justify-content-between">
																<strong>{suggestion.title}</strong>
																<span class="badge bg-secondary">{suggestion.category}</span>
															</div>
															<p class="text-muted small mb-0">{suggestion.explanation}</p>
														</div>
													{/each}
												</div>
											{/if}
										{/if}
									</CardBody>
								</Card>
							</div>
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

	.title {
		padding: 40px 0;
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

	:global(.form-control:focus) {
		border-color: #416fff;
		box-shadow: 0 0 0 0.2rem rgba(65, 111, 255, 0.25);
	}

	.gap-2 {
		gap: 0.5rem;
	}

	.suggestion-item {
		padding: 0.75rem;
		background-color: #f8f9fa;
		border-radius: 0.5rem;
	}

	.suggestion-item:hover {
		background-color: #e9ecef;
	}

	@media (max-width: 480px) {
		.wrapper {
			padding: 4px;
		}

		.title {
			padding: 40px 20px;
			font-size: 24px;
		}
	}
</style>
