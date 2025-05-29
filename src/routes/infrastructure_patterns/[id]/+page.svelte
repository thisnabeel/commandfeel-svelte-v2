<script lang="ts">
	import { page } from '$app/stores';
	import Api from '$lib/api/api';
	import { onMount } from 'svelte';
	import type { InfrastructurePattern } from '$lib/types/infrastructure_patterns';
	import { user } from '$lib/stores/user';

	let infrastructurePattern: InfrastructurePattern | null = null;
	let loading = true;
	let error = '';

	onMount(async () => {
		await fetchInfrastructurePattern();
	});

	async function fetchInfrastructurePattern() {
		try {
			infrastructurePattern = await Api.get(`/infrastructure_patterns/${$page.params.id}`);
			loading = false;
		} catch (err: any) {
			error = err?.message || 'An error occurred while fetching infrastructure pattern';
			loading = false;
		}
	}

	async function toggleVisibility() {
		if (!infrastructurePattern) return;

		try {
			await Api.put(`/infrastructure_patterns/${infrastructurePattern.id}`, {
				visibility: !infrastructurePattern.visibility
			});
			infrastructurePattern.visibility = !infrastructurePattern.visibility;
		} catch (err: any) {
			error = err?.message || 'An error occurred while updating infrastructure pattern';
		}
	}

	async function updateInfrastructurePattern() {
		if (!infrastructurePattern) return;

		try {
			await Api.put(`/infrastructure_patterns/${infrastructurePattern.id}`, {
				title: infrastructurePattern.title,
				description: infrastructurePattern.description
			});
		} catch (err: any) {
			error = err?.message || 'An error occurred while updating infrastructure pattern';
		}
	}
</script>

<div class="container">
	{#if error}
		<div class="alert alert-danger" role="alert">
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="loading">Loading infrastructure pattern...</div>
	{:else if infrastructurePattern}
		<div class="infrastructure-pattern-details">
			<div class="header">
				<h1>
					{#if $user?.admin}
						<input
							type="text"
							class="form-control title-input"
							bind:value={infrastructurePattern.title}
							on:blur={updateInfrastructurePattern}
						/>
					{:else}
						{infrastructurePattern.title}
					{/if}
				</h1>
				{#if $user?.admin}
					<button
						class="btn"
						class:btn-success={infrastructurePattern.visibility}
						class:btn-secondary={!infrastructurePattern.visibility}
						on:click={toggleVisibility}
					>
						{infrastructurePattern.visibility ? 'Visible' : 'Hidden'}
					</button>
				{/if}
			</div>

			<div class="description">
				{#if $user?.admin}
					<textarea
						class="form-control"
						bind:value={infrastructurePattern.description}
						on:blur={updateInfrastructurePattern}
						rows="3"
					/>
				{:else}
					<p>{infrastructurePattern.description}</p>
				{/if}
			</div>

			<div class="dependencies">
				<h3>Dependencies</h3>
				{#if infrastructurePattern?.infrastructure_pattern_dependencies?.length > 0}
					<ul class="dependency-list">
						{#each infrastructurePattern.infrastructure_pattern_dependencies || [] as dependency}
							<li>
								<span class="dependency-type">{dependency.dependable_type}:</span>
								{dependency.dependable.title}
							</li>
						{/each}
					</ul>
				{:else}
					<p>No dependencies</p>
				{/if}
			</div>
		</div>
	{:else}
		<div class="alert alert-warning" role="alert">Infrastructure pattern not found</div>
	{/if}
</div>

<style>
	.container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.infrastructure-pattern-details {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.title-input {
		font-size: 2rem;
		font-weight: bold;
		border: none;
		padding: 0;
		margin: 0;
		width: 100%;
	}

	.title-input:focus {
		outline: none;
		border-bottom: 2px solid #416fff;
	}

	.description {
		margin-bottom: 2rem;
	}

	.dependencies {
		border-top: 1px solid #eee;
		padding-top: 2rem;
	}

	.dependency-list {
		list-style: none;
		padding: 0;
	}

	.dependency-list li {
		padding: 0.5rem;
		border: 1px solid #eee;
		border-radius: 4px;
		margin: 0.5rem 0;
	}

	.dependency-type {
		font-weight: 500;
		color: #666;
		margin-right: 0.5rem;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		color: #666;
	}
</style>
