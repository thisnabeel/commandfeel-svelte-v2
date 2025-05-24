<script>
	import Param from './Param.svelte';
	import uuid from '$lib/functions/uuid';
	export let adding = false;
	export let save;
	export let params;
	let newInput = '';

	function submit() {
		adding = false;
		const hash = {
			uuid: uuid(params),
			title: newInput,
			position: params.length + 1
		};

		newInput = '';
		save(hash);

		// save(newInput);
	}
</script>

<div>
	{#each params as param}
		<Param {param} />
	{/each}

	{#if adding}
		<input
			type="text"
			bind:value={newInput}
			class="form-control newInput"
			style="width:max-content"
		/>
	{/if}
	<!-- svelte-ignore empty-block -->
	{#if adding}
		<span on:click={() => submit()} class="btn btn-outline-success"><i class="fa fa-check" /></span>
		<span on:click={() => (adding = false)} class="btn btn-outline-danger"
			><i class="fa fa-times" /></span
		>
	{:else}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<span on:click={() => (adding = true)} class="btn btn-outline-primary"
			><i class="fa fa-plus" /></span
		>
	{/if}
</div>

<style>
	.newInput,
	.newInput:focus {
		display: inline;
		background-color: purple;
		color: #fff;
	}
</style>
