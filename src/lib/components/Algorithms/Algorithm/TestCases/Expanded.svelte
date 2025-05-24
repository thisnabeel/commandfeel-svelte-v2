<script>
	import { user } from '$lib/stores/user';

	import InputVariables from './InputVariables/InputVariables.svelte';
	export let test_case;
	export let update;
	export let params;
	export let inputs;
	export let submit;
	export let deleteTestCase;

	function saveExpanded(payload) {
		console.log(payload);
		submit(payload);
	}

	let data_types = ['string', 'integer', 'array', 'dictionary', 'linked_list'];
</script>

<div class="test_case_expanded">
	<InputVariables inputs={test_case.inputs} {params} submit={(payload) => saveExpanded(payload)} />
	<label for="">Expectation:</label>
	<input
		type="text"
		class="form-control"
		bind:value={test_case.expectation}
		on:keyup={() => update(test_case)}
	/>
	<br />
	<select name="" id="" bind:value={test_case.data_type}>
		<option value="" />
		<!-- svelte-ignore empty-block -->
		{#each data_types as data_type}
			<option value={data_type}>{data_type}</option>
		{/each}
	</select>
	<hr />
	<div class="btn btn-outline-danger" on:click={() => deleteTestCase(test_case)}>
		Delete Test Case
	</div>
</div>

<style>
	.test_case_expanded {
		padding: 18px;
		display: block;
		background-color: rgb(246, 236, 255);
	}

	.result {
		padding: 18px 24px;
		background: #000;
		color: #fff;
		border-radius: 10px;
		font-size: 28px;
	}
</style>
