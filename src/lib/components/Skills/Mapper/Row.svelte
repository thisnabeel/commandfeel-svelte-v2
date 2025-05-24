<script>
	export let item;
	export let remove;
	import { goto } from '$app/navigation';

	import { selectedSkill } from '$lib/stores/skills/mapper';
	import { onMount } from 'svelte';

	// $: console.log('newItem', item);
	function handleSkillClick() {
		if ($selectedSkill && $selectedSkill.id === item.id) {
			selectedSkill.set(null);
		} else {
			selectedSkill.set(item);
		}
	}

	let showSettings = false;
</script>

<li class="skill" class:selected={$selectedSkill && item.id === $selectedSkill.id}>
	<span class="title" on:click={handleSkillClick}>{item.title} </span>
	<i class="fa fa-cog settings-btn" on:click={() => (showSettings = !showSettings)} />
	<i
		class="fa fa-link link-btn"
		on:click={() => {
			goto('/skills/' + item.slug);
		}}
	/>
	<!-- <div class="settings-hover" /> -->
	{#if showSettings && $selectedSkill && item.id === $selectedSkill.id}
		<div class="settings">
			<div class="btn btn-danger" on:click={() => remove(item)}><div class="fa fa-trash" /></div>
		</div>
	{/if}

	{#each item.skills || [] as skill}
		<svelte:self item={skill} {remove} type="skill" />
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
	.skill {
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

	.skill :global(.skill) {
		margin-left: 24px;
		border-left: 1px solid #ccc;
	}
</style>
