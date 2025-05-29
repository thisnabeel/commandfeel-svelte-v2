<script lang="ts">
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import type { InfrastructurePattern } from '$lib/types/infrastructure_patterns';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';

	let infrastructurePatterns: InfrastructurePattern[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		await fetchInfrastructurePatterns();
	});

	async function fetchInfrastructurePatterns() {
		try {
			infrastructurePatterns = await Api.get('/infrastructure_patterns');
			loading = false;
		} catch (err: any) {
			error = err?.message || 'An error occurred while fetching infrastructure patterns';
			loading = false;
		}
	}

	function goToMapper() {
		goto('/infrastructure_patterns/mapper');
	}
</script>

<div class="container">
	<div class="header">
		<h1>System Infrastructure Patterns</h1>
		{#if $user?.admin}
			<button class="btn btn-primary" on:click={goToMapper}>
				<i class="fa fa-sitemap" /> Manage Patterns
			</button>
		{/if}
	</div>

	{#if error}
		<div class="alert alert-danger" role="alert">
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="loading">Loading infrastructure patterns...</div>
	{:else if infrastructurePatterns.length > 0}
		<div class="infrastructure-patterns-grid">
			{#each infrastructurePatterns as infrastructurePattern}
				{#if infrastructurePattern.visibility || $user?.admin}
					<div
						class="infrastructure-pattern-card"
						on:click={() => goto(`/infrastructure_patterns/${infrastructurePattern.id}`)}
					>
						<div class="infrastructure-pattern-header">
							<h3>{infrastructurePattern.title}</h3>
							{#if $user?.admin && !infrastructurePattern.visibility}
								<span class="badge bg-secondary">Hidden</span>
							{/if}
						</div>
						<p class="description">{infrastructurePattern.description}</p>
						<div class="dependencies">
							<small>
								Dependencies: {infrastructurePattern?.infrastructure_pattern_dependencies?.length}
							</small>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="alert alert-info" role="alert">No infrastructure patterns available.</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.infrastructure-patterns-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.infrastructure-pattern-card {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
	}

	.infrastructure-pattern-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.infrastructure-pattern-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.infrastructure-pattern-header h3 {
		margin: 0;
		color: #333;
	}

	.description {
		color: #666;
		margin-bottom: 1rem;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.dependencies {
		color: #888;
		border-top: 1px solid #eee;
		padding-top: 0.5rem;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #666;
	}
</style>
