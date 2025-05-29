<script lang="ts">
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import Row from './Row.svelte';
	import { selectedInfrastructurePattern } from '$lib/stores/infrastructure_patterns/mapper';
	import sticky from '$lib/functions/sticky.js';
	import Fa from 'svelte-fa';
	import { faBolt } from '@fortawesome/free-solid-svg-icons';
	import type { InfrastructurePattern } from '$lib/types/infrastructure_patterns';

	let isStuck = false;
	let writing = false;
	let infrastructurePatterns: InfrastructurePattern[] = [];
	let newPatternTitle = '';
	let newPatternDescription = '';

	function handleStuck(e: CustomEvent<{ isStuck: boolean }>) {
		isStuck = e.detail.isStuck;
	}

	onMount(async () => {
		await getInfrastructurePatterns();
		window.addEventListener('keydown', move);
	});

	async function getInfrastructurePatterns() {
		try {
			const response = await Api.get('/infrastructure_patterns');
			infrastructurePatterns = response;
		} catch (error) {
			console.error('Failed to fetch infrastructure patterns:', error);
		}
	}

	async function addInfrastructurePattern() {
		if (newPatternTitle.length === 0) return;

		try {
			const response = await Api.post('/infrastructure_patterns', {
				title: newPatternTitle,
				description: newPatternDescription,
				position: infrastructurePatterns.length + 1,
				visibility: true
			});

			infrastructurePatterns = [...infrastructurePatterns, response];
			newPatternTitle = '';
			newPatternDescription = '';
		} catch (error) {
			console.error('Failed to add infrastructure pattern:', error);
		}
	}

	async function move(event: KeyboardEvent) {
		if (!$selectedInfrastructurePattern || writing) return;

		const index = infrastructurePatterns.findIndex(
			(p) => p.id === $selectedInfrastructurePattern.id
		);
		let newIndex: number;

		switch (event.key) {
			case 'w': // Move up
				newIndex = index - 1;
				if (newIndex >= 0) {
					const element = infrastructurePatterns.splice(index, 1)[0];
					infrastructurePatterns.splice(newIndex, 0, element);
					await reorderInfrastructurePatterns();
				}
				break;

			case 's': // Move down
				newIndex = index + 1;
				if (newIndex < infrastructurePatterns.length) {
					const element = infrastructurePatterns.splice(index, 1)[0];
					infrastructurePatterns.splice(newIndex, 0, element);
					await reorderInfrastructurePatterns();
				}
				break;
		}
	}

	async function reorderInfrastructurePatterns() {
		try {
			const reorderedPatterns = infrastructurePatterns.map((pattern, index) => ({
				id: pattern.id,
				position: index + 1
			}));

			await Api.post('/infrastructure_patterns/reorder', {
				infrastructure_patterns: reorderedPatterns
			});
			infrastructurePatterns = infrastructurePatterns.map((pattern, index) => ({
				...pattern,
				position: index + 1
			}));
		} catch (error) {
			console.error('Failed to reorder infrastructure patterns:', error);
		}
	}

	async function remove(pattern: InfrastructurePattern) {
		try {
			await Api.delete(`/infrastructure_patterns/${pattern.id}`);
			infrastructurePatterns = infrastructurePatterns.filter((p) => p.id !== pattern.id);
		} catch (error) {
			console.error('Failed to delete infrastructure pattern:', error);
		}
	}
</script>

<section>
	<div
		class="sticky"
		class:isStuck
		use:sticky={{ stickToTop: true }}
		on:stuck={handleStuck}
		data-position="top"
	>
		<div class="input-group mb-3">
			<input
				type="text"
				class="form-control"
				placeholder="Pattern Title"
				bind:value={newPatternTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
			/>
			<input
				type="text"
				class="form-control"
				placeholder="Pattern Description"
				bind:value={newPatternDescription}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
			/>
			<div class="input-group-append">
				<div class="btn-group">
					<div class="btn btn-info" on:click={addInfrastructurePattern}>Add Pattern</div>
				</div>
			</div>
		</div>
	</div>

	{#each infrastructurePatterns as infrastructurePattern}
		<ul class="clean-list">
			<Row {infrastructurePattern} {remove} />
		</ul>
	{/each}
</section>

<style>
	.sticky {
		position: sticky;
		padding: 1rem;
		background: #fff;
		transition: all 0.3s;
		z-index: 9999;
	}

	.sticky[data-position='top'] {
		top: 1rem;
	}

	:global(.clean-list) {
		list-style: none;
		padding: 0;
		margin: 0;
	}
</style>
