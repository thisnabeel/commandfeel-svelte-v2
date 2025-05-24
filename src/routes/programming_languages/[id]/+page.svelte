<script>
	import { page } from '$app/stores';

	import Api from '$lib/api/api';
	import { onMount } from 'svelte';
	import Mapper from '$lib/components/Algorithms/Mapper.svelte';

	import Algorithms from '$lib/components/Algorithms/Mapper/Mapper.svelte';
	import GradingSound from '$lib/components/Sounds/Grading.svelte';

	import { algorithmStore } from '$lib/stores/algorithms/mapper';
	import { user } from '$lib/stores/user';
	let lang = null;
	let algorithms;

	onMount(() => {
		getAlgo();
		getAlgos();
		getProgress();
	});

	async function getAlgo() {
		const response = await Api.get('/programming_languages/' + $page.params.id + '.json');
		lang = response;
		console.log('get programming language', { response });
	}

	let progress = [];
	async function getProgress() {
		if (!$user) return;
		progress = await Api.get(
			'/users/' + $user.id + '/languages/' + $page.params.id + '/attempts.json'
		);
		console.log({ progress });
	}

	async function getAlgos() {
		const response = await Api.get('/algorithms.json');
		algorithms = response;
		algorithmStore.set(algorithms);
	}
</script>

<GradingSound />

{#if lang}
	<div class="jumbotron">
		<h1>{lang.title}</h1>
	</div>

	<ul class="clean-list">
		<!-- {#each lang.algorithms.sort((a, b) => a.algorithm.position - b.algorithm.position) as algo, index}
			<Language language={lang} algorithm={algo.algorithm} starter={algo} {index} {progress} />
		{/each} -->
	</ul>

	<Mapper {algorithms} {progress} starters={lang.algorithms} language={lang} readOnly={true} />
{/if}

<style>
	.jumbotron {
		padding: 24px;
		/* background-color: rgb(235, 235, 235); */
		background-color: #fff;
	}
</style>
