<script>
	export let activeTestCaseId;
	export let select;
	export let executing;
	export let test_case;
	export let executions;
	export let index;

	// $: checkPassing(executing);

	function checkPassing(item) {
		// if (item.length === 0) console.log('DONE EXECUTING');
	}

	$: passing = executions[test_case.id] && executions[test_case.id].passing.passing;
	$: console.log({ executing });
	// console.log({ executions });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="btn btn-lg tab"
	class:activeTab={activeTestCaseId === test_case.id}
	class:wrong={!passing}
	class:correct={passing}
	on:click={() => {
		select();
		console.log({ activeTestCaseId });
	}}
>
	Case {index}
	{#if executing.map((t) => t.id).includes(test_case.id)}
		<img src="/spinner.gif" class="spinner" />
	{/if}
</div>

<style>
	.spinner {
		max-width: 25px;
		right: -10px;
		position: relative;
	}
	.wrong {
		background: red;
		color: #fff;
	}

	.correct {
		background: #00ff43;
		color: #000;
	}

	.purple {
		background-color: purple;
	}

	.tab {
		padding-bottom: 8px !important;
		margin-right: 4px;
	}

	.tab:hover {
		border-bottom: 6px solid rgb(163, 163, 255);
		padding-bottom: 2px !important;
	}

	.activeTab {
		border-color: blue;
	}
</style>
