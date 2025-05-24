<script>
	import API from '$lib/api/api';
	import debounce from '$lib/functions/debounce';
	import { set, test } from 'ramda';
	import Tab from './Tab.svelte';

	export let algorithm;

	import Expanded from './Expanded.svelte';
	import { writable } from 'svelte/store';
	import { user } from '$lib/stores/user';
	import Params from './Params/Params.svelte';
	import uuid from '$lib/functions/uuid';

	// Create a writable store for testing array
	const testing = writable([]);

	let execution = {};

	async function addTestCase() {
		if (!algorithm) return;
		const hash = {
			id: uuid(algorithm.test_cases),
			inputs: {},
			expectation: ''
		};

		algorithm.test_cases = [...algorithm.test_cases, hash];

		console.log({ algorithm });
		saveAlgo();
	}

	let activeTestCaseId = -1;

	async function saveAlgo() {
		console.log({ algorithm });
		const res = await debounce(`/algorithms/${algorithm.id}`, algorithm);
		console.log({ res });
	}

	function saveInputParams(payload) {
		console.log(payload);
		algorithm.input_params = [...algorithm.input_params, payload];
		// console.log({ algorithm });
		saveAlgo();
	}

	function handleUpdate(payload) {
		saveAlgo();
	}
	function saveExpanded(payload) {
		const test_case = algorithm.test_cases.find((tc) => tc.id === activeTestCaseId);

		if (test_case) {
			// Clone the array to avoid mutating the state directly
			const updatedTestCases = [...algorithm.test_cases];

			// Find the index of the test_case in the array
			const index = updatedTestCases.findIndex((tc) => tc.id === activeTestCaseId);

			// Update the corresponding test_case in the copied array
			updatedTestCases[index] = {
				...test_case,
				inputs: { ...test_case.inputs, ...payload }
			};

			// Set the updated array as the new state
			algorithm.test_cases = updatedTestCases;
		}
		console.log({ algorithm });

		saveAlgo();
	}

	function deleteTestCase(test_case) {
		console.log(test_case);
		console.log(algorithm.test_cases);
		const currentIndex = algorithm.test_cases.indexOf(test_case);
		const lastIndex = currentIndex - 1;

		// if (lastIndex > -1) {
		// }
		activeTestCaseId = algorithm.test_cases[lastIndex];
		algorithm.test_cases = algorithm.test_cases.filter((tc) => tc.id !== test_case.id);
		saveAlgo();
	}
</script>

<div class="wrapper">
	<label for="">Params:</label>
	<Params
		params={algorithm.input_params}
		save={(payload) => {
			saveInputParams(payload);
		}}
	/>

	<label for="">Cases:</label>
	{#if algorithm && algorithm.test_cases}
		<div class="test_cases">
			{#each algorithm.test_cases as test_case, index}
				<!-- svelte-ignore a11y-click-events-have-key-events -->

				<Tab
					{test_case}
					{activeTestCaseId}
					index={index + 1}
					select={() => {
						activeTestCaseId = test_case.id;
						console.log({ algorithm });
					}}
				/>
			{/each}

			<div class="btn btn-outline-primary" on:click={addTestCase}><i class="fa fa-plus" /></div>
		</div>

		{#if activeTestCaseId > -1}
			{#key activeTestCaseId}
				<Expanded
					test_case={algorithm.test_cases.find((t) => t.id === activeTestCaseId)}
					update={handleUpdate}
					params={algorithm.input_params}
					submit={saveExpanded}
					{deleteTestCase}
				/>
			{/key}
		{/if}
	{/if}
</div>

<style>
	.test_case_expanded {
		padding: 18px;
		display: block;
	}

	.wrapper {
		padding: 1em;
		border-radius: 8px;
		background: #fff;
	}
</style>
