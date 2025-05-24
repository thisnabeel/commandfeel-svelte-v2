<script>
	import API from '$lib/api/api';
	import Quiz from '$lib/components/Skills/Tabs/Quiz/Quiz.svelte';

	import { skills } from '$lib/stores/main';
	import { globalViewCategory } from '$lib/stores/view';
	import { onMount } from 'svelte';

	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import SearchSkills from './SearchSkills.svelte';

	export let jobSkills = null;
	let topics = [];

	onMount(() => {
		globalViewCategory.set('Skills');
	});

	let initiated = false;

	let quizzes = [];
	let loading = false;
	async function test() {
		initiated = true;
		loading = true;
		quizzes = await API.post('/quizzes/batch_test.json', {
			skills: topics.filter((s) => !s.disabled)
		});
		loading = false;
		console.log(quizzes);
	}

	function hideQuiz(quiz) {
		const id = quiz.id;
		quizzes = quizzes.filter((q) => q.id !== id);
	}

	let imported = false;
	$: {
		if (jobSkills && !imported) {
			topics = jobSkills;
			imported = true;
		}
	}

	function saveTopics(payload) {
		topics = payload;
	}

	export let prefillers = [];
</script>

<SearchSkills showInput={!jobSkills} {jobSkills} {topics} {saveTopics} {prefillers} />

{#if topics.length > 0 || prefillers.length > 0}
	<br />
	{#if loading}
		<div class="btn btn-lg btn-blocked btn-block">Loading...</div>
	{:else}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="btn btn-lg btn-primary btn-block" on:click={test}>
			{#if initiated}
				Test Topics
			{:else}
				Click To Test Topics
			{/if}
		</div>
	{/if}
{/if}

<div class="quizzes">
	{#each quizzes as quiz (quiz)}
		<div animate:flip={{ delay: 250, duration: 250, easing: quintOut }}>
			<Quiz {quiz} skill={quiz.skill} editable={false} linkable={true} {hideQuiz} />
		</div>
	{/each}
</div>

<style>
	.present {
		background-color: purple;
		color: #fff;
	}

	.input-wrapper {
		position: relative;
	}
	.topic {
		display: inline-block;
		margin: 8px;
		font-size: 24px;
		background-color: purple;
		color: #fff;
		padding: 10px;
		border-radius: 10px;
		line-height: 1;
	}

	.clearer {
		background-color: transparent;
		color: #000;
	}

	.clearer:hover {
		background-color: rgb(158, 102, 13);
		color: #fff;
	}

	.topic.disabled {
		background-color: #ccc;
	}

	.btn-blocked {
		background-color: gray;
		color: #fff;
	}
	.tester {
		font-size: 44px;
	}
	.result {
		padding: 16px;
	}

	.result:hover,
	.present:hover {
		background: rgb(255, 255, 180);
		color: #000;
	}

	.results {
		padding: 10px;
		background: #fff;
		font-size: 22px;
		/* display: none; */
		/* position: absolute; */
		top: 80px;
		width: 100%;
		border: 2px solid #5f4a4a;
		z-index: 999;
		position: absolute;
	}

	.quizzes {
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
		.quizzes {
			width: 95%;
		}

		.topic {
			display: inline-block;
			margin: 2px;
			font-size: 14px;
			line-height: 1;
			background-color: purple;
			color: #fff;
			padding: 10px;
			border-radius: 10px;
		}
	}
</style>
