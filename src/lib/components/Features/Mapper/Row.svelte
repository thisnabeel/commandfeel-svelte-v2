<script lang="ts">
	import { goto } from '$app/navigation';
	import { selectedInfrastructurePattern } from '$lib/stores/infrastructure_patterns/mapper';
	import type { InfrastructurePattern, Wonder } from '$lib/types/infrastructure_patterns';
	import Api from '$lib/api/api';

	export let infrastructurePattern: InfrastructurePattern;
	export let remove: (infrastructurePattern: InfrastructurePattern) => void;

	let showSettings = false;
	let showDependencies = false;
	let wondersList: Wonder[] = [];

	async function handleInfrastructurePatternClick() {
		if (
			$selectedInfrastructurePattern &&
			$selectedInfrastructurePattern.id === infrastructurePattern.id
		) {
			selectedInfrastructurePattern.set(null);
		} else {
			selectedInfrastructurePattern.set(infrastructurePattern);
		}
	}

	async function toggleVisibility() {
		try {
			await Api.put(`/infrastructure_patterns/${infrastructurePattern.id}`, {
				visibility: !infrastructurePattern.visibility
			});
			infrastructurePattern.visibility = !infrastructurePattern.visibility;
		} catch (error) {
			console.error('Failed to toggle infrastructure pattern visibility:', error);
		}
	}

	async function loadWonders() {
		if (!showDependencies) {
			try {
				const response = await Api.get('/wonders.json');
				wondersList = response;
			} catch (error) {
				console.error('Failed to load wonders:', error);
			}
		}
		showDependencies = !showDependencies;
	}

	async function addDependency(wonderId: number) {
		try {
			await Api.post(`/infrastructure_patterns/${infrastructurePattern.id}/add_dependency`, {
				dependable_type: 'Wonder',
				dependable_id: wonderId
			});
			// Refresh infrastructure pattern data
			const updatedPattern = await Api.get(`/infrastructure_patterns/${infrastructurePattern.id}`);
			infrastructurePattern = updatedPattern;
		} catch (error) {
			console.error('Failed to add dependency:', error);
		}
	}

	async function removeDependency(dependencyId: number) {
		try {
			await Api.delete(
				`/infrastructure_patterns/${infrastructurePattern.id}/dependencies/${dependencyId}`
			);
			infrastructurePattern?.infrastructure_pattern_dependencies? =
				infrastructurePattern?.infrastructure_pattern_dependencies?.filter(
					(dep) => dep.id !== dependencyId
				);
		} catch (error) {
			console.error('Failed to remove dependency:', error);
		}
	}
</script>

# Create a new file
<li
	class="infrastructure-pattern"
	class:selected={$selectedInfrastructurePattern &&
		infrastructurePattern.id === $selectedInfrastructurePattern.id}
>
	<div class="infrastructure-pattern-header">
		<span class="title" on:click={handleInfrastructurePatternClick}>
			{infrastructurePattern.title}
			<span class="description">{infrastructurePattern.description}</span>
		</span>
		<div class="controls">
			<button
				class="btn"
				class:btn-success={infrastructurePattern.visibility}
				class:btn-secondary={!infrastructurePattern.visibility}
				on:click={toggleVisibility}
			>
				{infrastructurePattern.visibility ? 'Visible' : 'Hidden'}
			</button>
			<button class="btn btn-info" on:click={loadWonders}>Dependencies</button>
			<button class="btn btn-warning" on:click={() => (showSettings = !showSettings)}>
				<i class="fa fa-cog" />
			</button>
		</div>
	</div>

	{#if showSettings}
		<div class="settings">
			<button class="btn btn-danger" on:click={() => remove(infrastructurePattern)}>
				<i class="fa fa-trash" /> Delete Pattern
			</button>
		</div>
	{/if}

	{#if showDependencies}
		<div class="dependencies">
			<h4>Current Dependencies:</h4>
			<ul class="dependency-list">
				{#each infrastructurePattern?.infrastructure_pattern_dependencies? || [] as dependency}
					<li>
						{dependency.dependable.title}
						<button class="btn btn-sm btn-danger" on:click={() => removeDependency(dependency.id)}>
							<i class="fa fa-times" />
						</button>
					</li>
				{/each}
			</ul>

			<h4>Add Dependencies:</h4>
			<ul class="wonders-list">
				{#each wondersList as wonder}
					<li>
						{wonder.title}
						<button class="btn btn-sm btn-success" on:click={() => addDependency(wonder.id)}>
							<i class="fa fa-plus" />
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</li>

<style>
	.infrastructure-pattern {
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 4px;
		margin: 0.5rem 0;
		padding: 1rem;
		transition: all 0.2s;
	}

	.infrastructure-pattern.selected {
		border-color: #416fff;
		box-shadow: 0 0 0 2px rgba(65, 111, 255, 0.2);
	}

	.infrastructure-pattern-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.title {
		font-size: 1.2rem;
		font-weight: 500;
		cursor: pointer;
	}

	.description {
		font-size: 0.9rem;
		color: #666;
		margin-left: 1rem;
		font-weight: normal;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
	}

	.settings {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.dependencies {
		margin-top: 1rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.dependency-list,
	.wonders-list {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 1rem;
	}

	.dependency-list li,
	.wonders-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 4px;
		margin: 0.25rem 0;
	}
</style>
