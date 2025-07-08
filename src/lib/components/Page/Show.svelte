<script>
	import { modals } from 'svelte-modals';

	import { page } from '$app/stores';
	import { navigating, updated } from '$app/stores';
	import Api from '$lib/api/api.js';

	import { user } from '$lib/stores/user';

	import Abstractions from './Tabs/Abstractions/Abstractions.svelte';
	import Challenges from './Tabs/Challenges/Challenges.svelte';
	import Quizzes from './Tabs/Quiz/Quizzes.svelte';
	import Quests from './Tabs/Quests/Quests.svelte';
	import Scripts from './Tabs/Scripts/Scripts.svelte';
	import Phrases from './Tabs/Phrases/Phrases.svelte';
	export let element;
	export let elementType;
	let tabs = ['Abstractions'];
	let admin_tabs = ['Abstractions', 'Quiz', 'Challenges', 'Quests', 'Scripts', 'Phrases'];

	let activeTab = 'Abstractions';

	// Tag Management
	let searchTerm = '';
	let searchResults = [];
	let tags = [];
	let showDropdown = false;

	async function loadTags() {
		try {
			tags = await Api.get(`/${elementType}/${element.id}/tags`);
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
			await Api.post(`/${elementType}/${element.id}/tags`, { tag_id: tag.id });
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

	$: if ($user?.admin && element?.id) {
		loadTags();
	}

	$: if (element && (!$user || !$user.admin)) {
		if (element.quiz_sets.length < 1) {
			tabs = tabs.filter((t) => t !== 'Quiz');
		}

		if (element.challenges.length < 1) {
			tabs = tabs.filter((t) => t !== 'Challenges');
		}
	}

	const fetchElement = async (slug) => {
		element = await Api.get(elementType + '/' + slug + '.json');
		console.log('gotten', element);
	};

	function openElementVideo(element, abstraction) {
		// modals.open(ElementModal, { element: element, abstraction: abstraction });
	}

	// $: console.log($user);
</script>

<section class="wrapper">
	<h1 class="title">{element.title}</h1>

	{#if $user?.admin}
		<div class="tags-section">
			{#each tags as tag}
				<span class="tag">{tag.title}</span>
			{/each}

			<div class="tag-search">
				<input type="text" bind:value={searchTerm} placeholder="Search tags..." class="tag-input" />
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
	{/if}

	<div class="flex" style="width: 100%; overflow-x: scroll">
		{#each $user?.admin ? admin_tabs : tabs as tab}
			<div class="tab" class:active={activeTab === tab} on:click={() => (activeTab = tab)}>
				{tab}
			</div>
		{/each}
	</div>

	{#if activeTab === 'Abstractions'}
		<Abstractions {element} {elementType} user={$user} />
	{/if}

	{#if activeTab === 'Challenges'}
		<Challenges {element} {elementType} />
	{/if}

	{#if activeTab === 'Quiz'}
		<Quizzes {element} {elementType} />
	{/if}

	{#if activeTab === 'Quests'}
		<Quests {element} {elementType} user={$user} />
	{/if}

	{#if activeTab === 'Scripts'}
		<Scripts {element} {elementType} />
	{/if}

	{#if activeTab === 'Phrases'}
		<Phrases {element} {elementType} />
	{/if}
</section>
<br />

<style>
	.tab {
		padding: 14px;
	}
	.tab.active {
		background-color: #000;
		color: #fff;
	}
	.flex {
		display: flex;
	}

	.flex > div {
		flex: 1 1 33%;
		text-align: center;
	}

	.title {
		padding: 40px 0px;
	}
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		position: relative;
	}

	.tags-section {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		padding: 0 0 20px 0;
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

	.abstractions {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		width: 70%;
		margin: 0 auto;
		padding: 20px 0;
	}

	@media (max-width: 480px) {
		.wrapper {
			padding: 4px;
		}

		.title {
			padding: 40px 20px;
			font-size: 24px;
		}
		.abstractions {
			width: 100%;
		}

		.abstractions > li {
			padding-top: 55px;
		}

		.tags-section {
			padding: 0 10px 20px 10px;
		}
	}
</style>
