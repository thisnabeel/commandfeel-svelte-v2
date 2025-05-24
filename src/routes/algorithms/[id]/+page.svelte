<script>
	import { page } from '$app/stores';

	import Api from '$lib/api/api';
	import { onMount } from 'svelte';
	import Languages from '$lib/components/Algorithms/Languages/Index.svelte';
	import update from '$lib/functions/debounce';
	import { user } from '$lib/stores/user';
	import { afterNavigate } from '$app/navigation';
	import TestCases from '$lib/components/Algorithms/Algorithm/TestCases/TestCases.svelte';
	import Description from '$lib/components/Algorithms/Algorithm/Description/Description.svelte';

	import { correctSound, incorrectSound } from '$lib/stores/view';
	import GradingSound from '$lib/components/Sounds/Grading.svelte';

	let algo = null;
	onMount(() => {
		getAlgo();
		getProgress();
	});

	$: console.log($correctSound);

	async function getAlgo() {
		const response = await Api.get('/algorithms/' + $page.params.id + '.json');
		algo = response;
		console.log(algo.language_algorithm_starters);
	}

	afterNavigate(async function () {
		getAlgo();
	});

	let progress = [];
	async function getProgress() {
		if (!$user) return;
		progress = await Api.get(
			'/users/' + $user.id + '/algorithms/' + $page.params.id + '/attempts.json'
		);
		console.log(progress);
	}

	let settingsView = -1;

	function selectSettingsTab(index) {
		if (settingsView === index) {
			settingsView = -1;
		} else {
			settingsView = index;
		}
	}
</script>

<GradingSound />
{#if algo}
	<div class="jumbotron">
		<span class="challenge-head">Coding Challenge:</span><br />
		<h1>{algo.title}</h1>
	</div>

	<div class="settingTabs">
		<div on:click={() => selectSettingsTab(1)} class:activeTab={settingsView === 1}>Test Cases</div>
		<div on:click={() => selectSettingsTab(2)} class:activeTab={settingsView === 2}>
			Description
		</div>
	</div>

	{#if $user && $user.admin}
		{#if settingsView === 1}
			<TestCases algorithm={algo} />
		{:else if settingsView === 2}
			<Description algorithm={algo} />
		{/if}
	{/if}

	<Languages algorithm={algo} {progress} />
{/if}

<style>
	.jumbotron {
		padding: 24px;
		/* background-color: rgb(235, 235, 235); */
		background-color: #3effec82;
	}

	.jumbotron h1 {
		text-shadow: 1px 3px 2px #ffca2d87;
	}

	.challenge-head {
		display: table;
		margin: 0px auto;
		border: 2px dashed #ffca2d87;
		border-radius: 20px;
		padding: 10px;
	}

	.settingTabs div {
		display: inline;
		font-size: 18px;
		padding: 10px;
		background-color: rgba(251, 251, 251, 0.59);
	}

	.settingTabs div.activeTab {
		background-color: #fff;
	}
</style>
