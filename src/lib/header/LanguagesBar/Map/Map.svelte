<script>
	import { wondersMap } from '$lib/stores/main';
	import { get } from 'svelte/store';
	import Row from './Row/Row.svelte';
	import { onMount } from 'svelte';
	import SkillCategories from './SkillCategories/SkillCategories.svelte';
	import { traitStore } from '$lib/stores/traits';

	let storedWondersMap;
	wondersMap.subscribe((value) => {
		console.log('wondersMap', value);
		storedWondersMap = value;
	});

	let show = 'traits';

	const handleToggleView = (target) => {
		show = target;
	};

	$: console.log(show);
</script>

{#if show === 'traits'}
	<!-- <button on:click={() => handleToggleView('wonders')}>Switch To Wonders?</button> -->
	<br />
	<h1>Programming Language Traits</h1>
	<hr />

	{#each $traitStore as trait}
		<ul>
			<Row item={trait} type="trait" />
		</ul>
	{/each}
{/if}

{#if show === 'wonders'}
	<button on:click={() => handleToggleView('traits')} class="btn">Switch To Skills?</button>
	{#each storedWondersMap as wonder}
		<!-- {console.log("selectedWonder", wonder)} -->
		<ul>
			<Row item={wonder} type="wonder" />
		</ul>
	{/each}
{/if}

<style>
	ul {
		list-style: none;
	}

	button {
		position: relative;
		top: -9px;
		left: -15px;
		color: #755c0f;
		border: 2px solid #ffc107;
		display: inline-block;
		font-weight: 400;
		color: #212529;
		text-align: center;
		vertical-align: middle;
		cursor: pointer;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		background-color: transparent;
		padding: 0.375rem 0.75rem;
		font-size: 1rem;
		line-height: 1.5;
		border-radius: 0.25rem;
		transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
			border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
	}
</style>
