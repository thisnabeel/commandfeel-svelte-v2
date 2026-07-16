<script>
	import { ABSTRACTION_LEVELS, labelForLevel } from '$lib/abstractionLevels.js';

	/** @type {number[]} */
	export let levels = ABSTRACTION_LEVELS.map((l) => l.value);
	export let selected = 0;
	export let onSelect = (level) => {};
</script>

{#if levels.length > 0}
	<div class="level-picker" role="group" aria-label="Abstraction level">
		{#each levels as level (level)}
			<button
				type="button"
				class="segment"
				class:active={selected === level}
				aria-pressed={selected === level}
				on:click={() => onSelect(level)}
			>
				{labelForLevel(level)}
			</button>
		{/each}
	</div>
{/if}

<style>
	.level-picker {
		display: flex;
		width: 100%;
		max-width: 420px;
		margin: 0 auto 1.25rem;
		border: 1.5px solid #0f172a;
		border-radius: 999px;
		overflow: hidden;
		background: #fff;
	}

	.segment {
		flex: 1 1 0;
		border: none;
		border-right: 1.5px solid #0f172a;
		background: transparent;
		color: #334155;
		font-family: 'Space Grotesk', GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		padding: 0.55rem 0.65rem;
		cursor: pointer;
		line-height: 1.2;
	}

	.segment:last-child {
		border-right: none;
	}

	.segment.active {
		background: #0f172a;
		color: #fff;
	}

	.segment:hover:not(.active) {
		background: rgba(15, 23, 42, 0.06);
	}
</style>
