<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Api from '$lib/api/api.js';
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

	let scripts = [];
	let loading = true;
	let error = '';
	let openScriptId = null;

	async function fetchScripts() {
		try {
			scripts = await Api.get('/scripts.json');
			loading = false;
		} catch (err) {
			error = err?.message || 'Failed to fetch scripts';
			loading = false;
		}
	}

	function toggleScript(scriptId) {
		openScriptId = openScriptId === scriptId ? null : scriptId;
	}

	onMount(fetchScripts);
</script>

<div class="wrapper" in:fade>
	<Container class="py-4">
		<div class="title mb-4 text-center">
			<h1 class="space-grotesk-heading">Scripts</h1>
		</div>

		{#if error}
			<div class="alert alert-danger" role="alert">
				<p class="font-medium">{error}</p>
			</div>
		{/if}

		{#if loading}
			<div class="d-flex justify-content-center py-4">
				<Spinner color="primary" />
			</div>
		{:else if scripts.length === 0}
			<Card>
				<CardBody>
					<p class="text-muted py-4 text-center">No scripts found.</p>
				</CardBody>
			</Card>
		{:else}
			<div class="scripts-list">
				{#each scripts as script (script.id)}
					<Card class="script-card mb-3">
						<CardHeader
							class="d-flex justify-content-between align-items-center cursor-pointer"
							on:click={() => toggleScript(script.id)}
						>
							<h3 class="mb-0">{script.title}</h3>
							<i class="fas fa-chevron-{openScriptId === script.id ? 'up' : 'down'}" />
						</CardHeader>

						<Collapse isOpen={openScriptId === script.id}>
							<CardBody>
								<div class="script-content">
									{#if script.body}
										<div class="content">
											<h4>Video Script</h4>
											{@html script.body}
										</div>
									{/if}

									{#if script.linkedin_body}
										<div class="content mt-4">
											<h4>LinkedIn Post</h4>
											{@html script.linkedin_body}
										</div>
									{/if}

									{#if script.tiktok_body}
										<div class="content mt-4">
											<h4>TikTok Script</h4>
											{@html script.tiktok_body}
										</div>
									{/if}

									{#if script.youtube_title || script.youtube_body}
										<div class="content mt-4">
											<h4>YouTube</h4>
											{#if script.youtube_title}
												<h5 class="youtube-title">{script.youtube_title}</h5>
											{/if}
											{@html script.youtube_body || ''}
										</div>
									{/if}
								</div>
							</CardBody>
						</Collapse>
					</Card>
				{/each}
			</div>
		{/if}
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

	.script-card {
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s;
	}

	.script-card:hover {
		transform: translateY(-2px);
	}

	:global(.card-header) {
		background-color: transparent;
		border-bottom: 1px solid #eee;
		padding: 1.5rem;
		cursor: pointer;
	}

	:global(.card-header:hover) {
		background-color: #f8f9fa;
	}

	:global(.card-body) {
		padding: 1.5rem;
	}

	.content {
		color: #666;
		font-size: 1rem;
		line-height: 1.6;
	}

	.content h4 {
		color: #333;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.content h5 {
		color: #666;
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
	}

	.youtube-title {
		color: #333;
		margin-bottom: 1rem;
	}

	.content :global(p) {
		margin-bottom: 1rem;
	}

	.content :global(ul),
	.content :global(ol) {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	.content :global(li) {
		margin-bottom: 0.5rem;
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
