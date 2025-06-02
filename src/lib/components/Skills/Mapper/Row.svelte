<script>
	export let item;
	export let remove;
	import { goto } from '$app/navigation';

	import { selectedSkill } from '$lib/stores/skills/mapper';
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';

	// $: console.log('newItem', item);
	function handleSkillClick() {
		if ($selectedSkill && $selectedSkill.id === item.id) {
			selectedSkill.set(null);
		} else {
			selectedSkill.set(item);
		}
	}

	let showSettings = false;
	let searchTerm = '';
	let searchResults = [];
	let tags = [];
	let showDropdown = false;
	let writing = false;

	async function loadTags() {
		if (!$selectedSkill) return;
		try {
			tags = await Api.get(`/skills/${item.id}/tags`);
		} catch (err) {
			console.error('Failed to load tags:', err);
		}
	}

	async function searchTags() {
		if (searchTerm.length < 2) {
			searchResults = [];
			showDropdown = false;
			return;
		}

		try {
			searchResults = await Api.get(`/tags/search?q=${searchTerm}`);
			showDropdown = true;
		} catch (err) {
			console.error('Failed to search tags:', err);
			searchResults = [];
			showDropdown = false;
		}
	}

	async function addTag(tag) {
		try {
			await Api.post(`/skills/${item.id}/tags`, { tag_id: tag.id });
			tags = [...tags, tag];
			searchTerm = '';
			showDropdown = false;
		} catch (err) {
			console.error('Failed to add tag:', err);
		}
	}

	$: if (searchTerm.length >= 2) {
		searchTags();
	}

	$: if (showSettings && $selectedSkill && item.id === $selectedSkill.id) {
		loadTags();
	}
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
			<div class="tags-section">
				{#each tags as tag}
					<span class="tag">{tag.title}</span>
				{/each}

				<div class="tag-search">
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Search tags..."
						class="tag-input"
						on:focus={() => (writing = true)}
						on:blur={() => (writing = false)}
					/>
					{#if showDropdown && searchResults.length > 0}
						<div class="dropdown">
							{#each searchResults as result}
								<div class="dropdown-item" on:click={() => addTag(result)}>
									{result.title}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
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

	.tags-section {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}

	.tag {
		background: #e9ecef;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.9em;
	}

	.tag-search {
		position: relative;
		min-width: 200px;
	}

	.tag-input {
		width: 100%;
		padding: 4px 8px;
		border: 1px solid #ced4da;
		border-radius: 4px;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #ced4da;
		border-radius: 4px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 1000;
	}

	.dropdown-item {
		padding: 8px;
		cursor: pointer;
	}

	.dropdown-item:hover {
		background: #f8f9fa;
	}
</style>
