<script>
	import API from '$lib/api/api';
	import debounce from '$lib/functions/debounce';
	import { set, test } from 'ramda';
	import Tab from './Tab.svelte';

	export let language;
	export let starter;
	export let testNow;
	export let algorithm;
	export let pass;

	export let blocks;

	import Expanded from './Expanded.svelte';
	import { writable } from 'svelte/store';
	import { user } from '$lib/stores/user';
	import { correctSound, incorrectSound, victorySound } from '$lib/stores/view';

	// Create a writable store for testing array
	const testing = writable([]);

	let execution = {};

	async function addTestCase() {
		if (!starter) return;
		const res = await API.post('/test_cases', {
			language_algorithm_starter_id: starter.id,
			code: '',
			expectation: '',
			position: starter.test_cases.length + 1
		});
		starter.test_cases = [...starter.test_cases, res];
	}

	let activeTestCaseId = -1;

	async function handleUpdate(payload) {
		console.log({ payload });
		const res = await debounce(`/test_cases/${payload.id}`, payload);

		starter.test_cases = starter.test_cases.map((t) => {
			if (t.id === res.id) {
				t = res;
			}
			return t;
		});

		console.log(starter.test_cases);
	}

	async function beginTest() {
		console.log('Starting', $testing);
		testing.set([...algorithm.test_cases]);

		let results = [];
		// return;
		while ($testing.length > 0) {
			const res = await testCase($testing[0]); // Use the first element
			// Update the store to trigger reactivity
			results = [...results, res];
			$testing.shift(); // Remove the first element
			testing.set([...$testing]);
		}

		console.log('RESULTS', results);
		console.log('DONE', $testing);
		const allTrue = results.every((element) => typeof element === 'boolean' && element === true);
		if (allTrue) {
			setTimeout(function () {
				saveAttempt();
				victorySound.set($victorySound + 1);
			}, 1500);
		}
	}

	async function saveAttempt() {
		const res = await API.post('/attempts', {
			user_id: $user.id,
			programming_language_id: language.id,
			algorithm_id: algorithm.id,
			passing: true
		});
		console.log({ res });
		pass(res);
	}

	function fullCode() {
		return blocks
			.map((b) => {
				if (b.prefix_test) {
					return ['~~', b.code].join('\n');
				} else {
					return b.code;
				}
			})
			.join('\n');
	}

	async function testCase(test_case) {
		try {
			console.log({ test_case });
			const res = await API.post(`/algorithms/${algorithm.id}/execute.json`, {
				code: fullCode(),
				language: language,
				test_case: test_case,
				algorithm_id: algorithm.id
			});

			// Handle the response here if needed
			// console.log({ res });

			// Update the state
			execution[test_case.id] = res;
			execution = execution;
			console.log({ execution });
			console.log({ res });
			if (res.passing) {
				console.log('check', res.passing.passing);
				if (res.passing.passing === true) {
					correctSound.set($correctSound + 1);
				} else {
					incorrectSound.set($incorrectSound + 1);
				}
			}

			return res.passing.passing;

			// Await closeExecution to ensure it's complete before moving on
			// await closeExecution(test_case);
		} catch (error) {
			console.error('Error executing test case:', error);
		}
	}

	function closeExecution(test_case) {
		console.log(`Test Case ${test_case.id} Executed`);
		const index = testing.findIndex((t) => t.id === test_case.id);

		if (index !== -1) {
			testing.splice(index, 1);
		}

		console.log({ testing });

		// Returning a resolved promise to ensure it can be awaited
		return Promise.resolve();
	}

	$: if (testNow && testNow > 0) {
		beginTest();
	}
</script>

{#each algorithm.test_cases as test_case, index}
	<!-- svelte-ignore a11y-click-events-have-key-events -->

	<Tab
		{test_case}
		{activeTestCaseId}
		executing={$testing}
		index={index + 1}
		select={() => {
			console.log({ test_case });
			activeTestCaseId = test_case.id;
		}}
		executions={execution}
	/>
{/each}
{#if algorithm && algorithm.test_cases}
	{#if $user && $user.admin}
		<div class="btn btn-outline-primary" on:click={addTestCase}><i class="fa fa-plus" /></div>
	{/if}

	{#if activeTestCaseId > -1}
		{#key activeTestCaseId}
			<Expanded
				test_case={algorithm.test_cases.find((t) => t.id === activeTestCaseId)}
				{language}
				update={handleUpdate}
				executions={execution}
			/>
		{/key}
	{/if}
{/if}

<style>
	.test_case_expanded {
		padding: 18px;
		display: block;
	}
</style>
