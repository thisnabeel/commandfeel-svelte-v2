<script>
	import { modals } from 'svelte-modals';
	// import ChapterModal from '$lib/modals/videos/chapter.svelte';
	// import { chapters } from '$lib/stores/main';

	import { page } from '$app/stores';
	import { navigating, updated } from '$app/stores';
	import Api from '$lib/api/api.js';

	import { user } from '$lib/stores/user';

	import Abstractions from './Tabs/Abstractions/Abstractions.svelte';
	import Challenges from './Tabs/Challenges/Challenges.svelte';
	import Quizzes from './Tabs/Quiz/Quizzes.svelte';
	import Quests from './Tabs/Quests/Quests.svelte';

	export let chapter;
	let tabs = ['Abstractions', 'Quiz', 'Challenges', 'Quests'];
	let activeTab = 'Abstractions';

	$: if (chapter && (!$user || !$user.admin)) {
		if (chapter.quiz_sets.length < 1) {
			tabs = tabs.filter((t) => t !== 'Quiz');
		}

		if (chapter.challenges.length < 1) {
			tabs = tabs.filter((t) => t !== 'Challenges');
		}

		if (chapter.quests.length < 1) {
			tabs = tabs.filter((t) => t !== 'Quests');
		}
	}

	const fetchChapter = async (slug) => {
		chapter = await Api.get('/chapters/' + slug + '.json');
		console.log('gotten', chapter);
	};

	function openChapterVideo(chapter, abstraction) {
		// modals.open(ChapterModal, { chapter: chapter, abstraction: abstraction });
	}

	// $: console.log($user);
</script>

<section class="wrapper">
	<h1 class="title">{chapter.title}</h1>

	<div class="flex">
		{#each tabs as tab}
			<div class="tab" class:active={activeTab === tab} on:click={() => (activeTab = tab)}>
				{tab}
			</div>
		{/each}
	</div>

	{#if activeTab === 'Abstractions'}
		<Abstractions {chapter} user={$user} />
	{/if}

	{#if activeTab === 'Challenges'}
		<Challenges {chapter} user={$user} />
	{/if}

	{#if activeTab === 'Quiz'}
		<Quizzes {chapter} user={$user} />
	{/if}

	{#if activeTab === 'Quests'}
		<Quests {chapter} user={$user} />
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
	}
</style>
