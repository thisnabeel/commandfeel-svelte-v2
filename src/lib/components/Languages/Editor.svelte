<script>
	import Api from '$lib/api/api';
	import CodeEditor from '../CodeEditor/CodeEditor.svelte';
	import Language from './Language.svelte';

	export let language;
	let result = null;

	let code = '';
	function handleEditorChange(value, event) {
		// console.log('here is the current model value:', value);
		code = value;
	}

	async function test() {
		const response = await Api.post(`/execute_code`, {
			code: code,
			language: language.editor_slug
		});
		console.log(response);
		result = response;
	}
</script>

<div class="holder">
	<CodeEditor height="30vh" defaultLanguage={language.editor_slug} onChange={handleEditorChange} />
</div>

<div class="btn btn-info btn-block btn-lg" style="display:block;" on:click={test}>Run</div>

{#if result}
	<div class="result">
		{@html result.output}
	</div>
{/if}

<style>
	.holder {
		padding: 12px;
		background: #fff;
	}
	.result {
		padding: 10px;
		font-size: 24px;
		background: purple;
		color: #fff;
	}
</style>
