<script>
	export let item;
	export let remove;
	import { goto } from '$app/navigation';

	import { selectedWonder } from '$lib/stores/wonders/mapper';
	import { onMount } from 'svelte';

	// $: console.log('newItem', item);
	function handleWonderClick() {
		if ($selectedWonder && $selectedWonder.id === item.id) {
			selectedWonder.set(null);
		} else {
			selectedWonder.set(item);
		}
	}

	let showSettings = false;
</script>

<li class="wonder" class:selected={$selectedWonder && item.id === $selectedWonder.id}>
	<span class="title" on:click={handleWonderClick}>{item.title} </span>
	<i class="fa fa-cog settings-btn" on:click={() => (showSettings = !showSettings)} />
	<i
		class="fa fa-link link-btn"
		on:click={() => {
			goto('/wonders/' + item.slug);
		}}
	/>
	<!-- <div class="settings-hover" /> -->
	{#if showSettings && $selectedWonder && item.id === $selectedWonder.id}
		<div class="settings">
			<div class="btn btn-danger" on:click={() => remove(item)}><div class="fa fa-trash" /></div>
		</div>
	{/if}

	{#each item.wonders || [] as wonder}
		<svelte:self item={wonder} {remove} type="wonder" />
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
	.wonder {
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

	.wonder :global(.wonder) {
		margin-left: 24px;
		border-left: 1px solid #ccc;
	}
</style>
