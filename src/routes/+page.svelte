<script>
	import Home from '$lib/pages/Home/Home.svelte';

	import Api from '$lib/api/api.js';
	import { popularWonders } from '$lib/stores/main.js';
	import { onMount } from 'svelte';
	import PopularQuestsSampler from '$lib/components/Quests/PopularQuestsSampler.svelte';

	import Tester from '$lib/components/Tester/Tester.svelte';
	import Quiz from '$lib/components/Skills/Tabs/Quiz/Quiz.svelte';
	import { currentPage, globalViewCategory } from '$lib/stores/view';

	import AlgorithmsHome from '$lib/components/Algorithms/Landing/Index.svelte';
	import { afterNavigate } from '$app/navigation';
	import TikTokQuiz from '$lib/components/TikTokQuiz/TikTokQuiz.svelte';

	const fetchPopularWonders = async () => {
		const response = await Api.get('/museum.json');
		let json = response;
		popularWonders.set(json);
	};

	let quizzes = [];
	const fetchQuestions = async () => {
		quizzes = await Api.get('/quizzes.json');
	};

	onMount(async function () {
		// fetchQuestions();
	});

	afterNavigate(() => {
		if ($globalViewCategory === 'Skills') {
			currentPage.set('popQuiz');
		}
	});
</script>

<svelte:head>
	<title>The Software Engineering Gym</title>
	<meta name="description" content="commandfeel" />
</svelte:head>
<!-- 
<div class="quizzes">
	{#each quizzes as quiz}
		<Quiz {quiz} skill={quiz.skill} editable={false} linkable={true} />
	{/each}
</div> -->
<!-- 
<div class="intro">
	<div class="box">
		<div class="content">I am NOT comfortable with the idea of programming</div>
	</div>
	<div class="box">
		<div class="content">I am comfortable with the idea of programming</div>
	</div>
</div>
<br /> -->

{#if $globalViewCategory === 'Skills'}
	<Tester prefillers={['SOLID Principles', 'DevOps']} />
{/if}

{#if $globalViewCategory === 'Languages'}
	<AlgorithmsHome />
{/if}

<PopularQuestsSampler />

<style>
	.intro {
		display: flex;
	}

	.intro > .box {
		flex: 1;
	}
	.intro .content {
		background: purple;
		margin: 10px;
		height: 100%;
		padding: 100px;
		color: #fff;
		border-radius: 10px;
		font-weight: bold;
		font-size: 24px;
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
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		/* position: absolute; */
		margin: 0 auto;
		max-width: 350px;
		top: 0;
		display: block;
	}

	@media (max-width: 480px) {
	}
</style>
