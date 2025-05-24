<script>
	import { goto } from '$app/navigation';
	import API from '$lib/api/api';
	import ListItem from './ListItem.svelte';
	import Box from '$lib/components/Algorithms/Languages/Language.svelte';
	import { user } from '$lib/stores/user';
	import { page } from '$app/stores';
	export let algorithm;
	export let selectedAlgorithm;
	export let selectAlgorithm;
	export let visitAlgorithm;
	export let readOnly;
	export let language;
	export let child_level = 0;
	export let starters = [];

	export let progress = [];

	let openStarter = false;

	let starter;

	async function fetchStarter() {
		// console.log({ starters });
		// return;
		// console.log(language);
		if (algorithm.header) return;
		if (starter) {
			starter = null;
			openStarter = false;
			return;
		}

		openStarter = true;
		// selectAlgorithm(algorithm);
		starter = await API.get(
			`/language_algorithm_starters/finder/${language.id}/${algorithm.id}.json`
		);
	}

	function handlePass(payload) {
		progress = [...progress, payload];
		console.log({ progress });
	}

	$: hasStarter =
		readOnly && !algorithm.header && starters.find((s) => s.algorithm_id === algorithm.id);
	$: isHeader = readOnly && algorithm.header;
	$: isAdmin = $user && $user.admin;
	$: isAlgoPage = !$user && algorithm.test_cases.length > 0;
</script>

<li
	class="algorithm"
	class:header={algorithm.header}
	class:selected={selectedAlgorithm ? selectedAlgorithm.id === algorithm.id : false}
	class:openStarter
	class:visitable={!$user && !user.admin && readOnly && !algorithm.header}
>
	{#if hasStarter || isHeader || isAdmin || isAlgoPage}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="head"
			style="margin-left: {32 * child_level}px"
			on:click={() => {
				if (readOnly) {
					if (language) {
						fetchStarter();
						return;
					}
					if (!$user && !user.admin) {
						goto('/algorithms/' + algorithm.id);
						return;
					}
					fetchStarter();
				} else {
					selectAlgorithm(algorithm);
				}
			}}
		>
			{algorithm.title}

			{#if readOnly && language && progress}
				{#if progress.filter((p) => p.programming_language_id === language.id && p.algorithm_id === algorithm.id).length > 0}
					<i class="fa fa-star star" />
				{/if}
			{/if}

			{#if !readOnly}
				<div class="btn btn-warning" on:click={() => goto('/algorithms/' + algorithm.id)}>
					<i class="fa fa-link" />
				</div>

				<i
					class="fa"
					class:fa-toggle-on={algorithm.header}
					class:fa-toggle-off={!algorithm.header}
					on:click={async () => {
						algorithm.header = !algorithm.header;
						await API.put('/algorithms/' + algorithm.id, {
							header: algorithm.header
						});
					}}
				/>
			{/if}
		</div>
	{/if}
	{#if starter}
		<Box {language} {algorithm} {starter} {progress} {readOnly} open={true} pass={handlePass} />
	{/if}

	<div class="children">
		{#each algorithm.children || [] as child}
			<ListItem
				{language}
				{readOnly}
				{selectedAlgorithm}
				algorithm={child}
				{selectAlgorithm}
				{visitAlgorithm}
				{progress}
				{starters}
				child_level={child_level + 1}
			/>
		{/each}
	</div>
</li>

<style>
	.selected > .head {
		background-color: #b8eeff !important;
	}

	.selected.header > .head {
		/* background-color: transparent !important; */
		/* border-bottom: 4px dashed #000; */
		border-bottom: 4px dashed #b8eeff !important;
		/* color: #fff; */
	}

	.openStarter > .head {
		background-color: #b8eeff !important;
	}

	.header > .head {
		background-color: transparent;
		/* border-bottom: 4px dashed #000 !important; */
		border-bottom: 4px dashed #b8eeff !important;

		/* color: #fff; */
	}

	.wrapper {
		padding: 20px;
	}

	.algorithm {
		/* padding-left: 10px; */
	}
	.algorithm > .head {
		/* margin-left: 32px; */
		padding-left: 6px;
		border-left: 4px solid #b8eeff;
	}

	.head {
		padding: 8px;
		font-size: 24px;
		background: rgb(255 248 222);
		margin: 4px;
		border-radius: 8px;
		position: relative;
	}

	.visitable {
		cursor: pointer;
	}
	.visitable:hover > .head {
		background-color: rgb(222, 240, 255);
	}
	/* 
	.children {
		margin-left: 32px;
	} */

	.star {
		color: #ffe34c;
		position: absolute;
		left: -33px;
		top: 11px;
		-webkit-text-stroke: medium;
		-webkit-text-stroke-width: 1px;
		-webkit-text-stroke-color: #be9500;
		text-shadow: 0px 2px 3px #60530c;
	}
</style>
