<script>
	export let item;
	export let remove;
	import { goto } from '$app/navigation';

	import { selectedAlgorithm } from '$lib/stores/algorithms/mapper';
	import { onMount } from 'svelte';

	// $: console.log('newItem', item);
	function handleAlgorithmClick() {
		if ($selectedAlgorithm && $selectedAlgorithm.id === item.id) {
			selectedAlgorithm.set(null);
		} else {
			selectedAlgorithm.set(item);
		}
	}

	let showSettings = false;
</script>

<li class="algorithm" class:selected={$selectedAlgorithm && item.id === $selectedAlgorithm.id}>
	<span class="title" on:click={handleAlgorithmClick}>{item.title} </span>
	<i class="fa fa-cog settings-btn" on:click={() => (showSettings = !showSettings)} />
	<i
		class="fa fa-link link-btn"
		on:click={() => {
			goto('/algorithms/' + item.slug);
		}}
	/>
	<!-- <div class="settings-hover" /> -->
	{#if showSettings && $selectedAlgorithm && item.id === $selectedAlgorithm.id}
		<div class="settings">
			<div class="btn btn-danger" on:click={() => remove(item)}><div class="fa fa-trash" /></div>
		</div>
	{/if}

	{#each item.algorithms || [] as algorithm}
		<svelte:self item={algorithm} {remove} type="algorithm" />
	{/each}
</li>

<style>
	.settings {
		padding: 20px;
		background: aliceblue;
		border: 2px solid #c7c7ff;
	}

	.settings-btn {
		display: none;
		color: #ccc;
	}

	.link-btn {
		display: none;
		color: #ccc;
	}

	.link-btn:hover {
		color: rgb(221, 255, 128);
	}

	.selected > .settings-btn {
		display: inline;
		position: absolute;
		top: 10px;
		left: -105px;
		font-size: 46px;
	}

	.selected > .link-btn {
		display: inline;
		position: absolute;
		top: 10px;
		left: -55px;
		font-size: 46px;
	}
	.algorithm {
		position: relative;
	}
	/* .settings-hover {
		background: #fff2002e;
		width: 34px;
		height: 100%;
		position: absolute;
		right: 0;
		top: 0;
	} */
	.title {
		width: 100%;
		padding: 14px;
		display: block;
		font-size: 28px;
	}
	.selected > .title {
		background: rgb(199, 199, 255);
	}

	.algorithm :global(.algorithm) {
		margin-left: 24px;
		border-left: 1px solid #ccc;
	}
</style>
