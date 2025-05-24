<script>
	export let language;
	export let test_case;
	export let update;
	export let executions = null;

	let editorRef = null;
	let lineCount = 1;

	// $: console.log({ executions });
	$: console.log({ test_case });
</script>

<div class="test_case_expanded">
	<h2>Input:</h2>

	{#each Object.entries(test_case.inputs) as input}
		<div class="row">
			<div class="col-lg-4 col-md-4">
				<div class="inputKey">
					{input[0]}
				</div>
			</div>
			<div class="col-lg-8 col-md-8">
				<div class="inputValue">
					{input[1]}
				</div>
			</div>
		</div>
	{/each}

	<br />
	<h2>Expected Output:</h2>
	<div class="inputValue">{test_case.expectation}</div>

	{#if executions && executions[test_case.id]}
		<br />
		<h2>Got:</h2>
		<li class="result">
			<!-- {@html executions[test_case.id].output} -->
			{#each executions[test_case.id].output.split('\n') as line, index}
				{@html line}
				{#if index !== executions[test_case.id].output.split('\n').length - 1}
					<br />
				{/if}
			{/each}
		</li>
	{/if}
</div>

<style>
	.test_case_expanded {
		padding: 18px;
		display: block;
	}

	.result {
		padding: 18px 24px;
		background: #000;
		color: #fff;
		border-radius: 10px;
		font-size: 28px;
	}

	.inputKey,
	.inputValue {
		font-size: 24px;

		display: block;
		width: 100%;
		padding: 0.4em 0.8em;

		border-radius: 10px;
	}

	.inputKey {
		background-color: #000;
		color: #fff;
	}

	.inputValue {
		background-color: #fff;
		color: #000;
	}
</style>
