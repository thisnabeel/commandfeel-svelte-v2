<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import Swal from 'sweetalert2';
	import { user } from '$lib/stores/user';
	import Block from './Block.svelte';
	import API from '$lib/api/api';
	import { loomifiedView } from '$lib/stores/view';
	import TestCases from './TestCases/TestCases.svelte';
	import CodeEditor from '../CodeEditor/CodeEditor.svelte';

	// import MonacoEditor from 'monaco-editor';

	export let language;
	export let updateCode;
	export let trait;
	export let runnable = false;
	export let runClicked;

	export let algorithm;

	export let pass;

	let fetched = false;
	export let fetched_trait = null;
	let result = null;
	let code = '';

	let error = null;

	$: body = fetched_trait ? fetched_trait.body : null;

	let testNow = 0;

	async function test() {
		if (!$user) {
			Swal.fire('Unauthorized', 'Please Sign In/Up on the Top Right To Run', 'warning');
			return;
		}
		testNow += 1;
		if (!algorithm) {
			runClicked(code);
		}
		return;
	}

	let video_url = null;
	let mainStarter = null;

	onMount(async () => {
		if (algorithm) {
			const starter = await Api.get(
				`/language_algorithm_starters/finder/${language.id}/${algorithm.id}.json`
			);
			if (starter) {
				mainStarter = starter;
				blocks = starter.code_lines;
				video_url = starter.video_url;
			}
		} else {
			if (!trait) return;
			if (fetched_trait) return;
			console.log('Happen');
			fetched_trait = await Api.get(
				'/programming_languages/' + language.id + '/traits/' + trait.id + '.json'
			);
			console.log(fetched_trait);
			fetched = true;
		}
	});

	let editorRef = null;

	let lineCount = 1;
	function handleEditorDidMount(editor, monaco) {
		// here is the editor instance
		// you can store it in `useRef` for further usage
		editorRef = editor;
		lineCount = editorRef.getModel().getLineCount();
		editorRef.updateOptions({ scrollBeyondLastLine: false });

		if (!$user) {
			editorRef.updateOptions({ readOnly: true });
		}
	}

	function handleEditorChange(value, event) {
		if (updateCode) {
			updateCode(value, language);
		} else {
			code = value;
		}

		lineCount = editorRef.getModel().getLineCount();
	}

	function updateHeight() {
		console.log('hiii');
	}

	let blocks = [];
	// console.log({ blocks });
	$: fullCode = blocks.map((b) => b.code).join('\n');
	$: console.log({ fullCode });

	function uuid() {
		const min = 100; // Minimum 3-digit number
		const max = 999; // Maximum 3-digit number

		let randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
		while (blocks.map((b) => b.id).includes(randomCode)) {
			randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
		}
		return randomCode;
	}

	function addBlock() {
		blocks = [
			...blocks,
			{
				code: '',
				id: uuid(),
				disabled: false,
				prefix_test: false
			}
		];
	}

	async function saveBlocks() {
		if (video_url && video_url.length < 1) video_url = null;
		const response = await API.post('/language_algorithm_starters.json', {
			programming_language_id: language.id,
			algorithm_id: algorithm.id,
			code_lines: blocks,
			video_url: video_url
		});
		console.log({ response });
	}

	let showVideo = false;

	let importOptions = [];
	let showImportMenu = false;

	async function toggleImportOptions() {
		if (showImportMenu) {
			importOptions = [];
			showImportMenu = false;
		} else {
			importOptions = await API.get('/programming_languages/' + language.id + '/starters.json');
			console.log({ importOptions });
			showImportMenu = true;
		}
		console.log({ showImportMenu });
	}

	function importLines(option) {
		blocks = [];
		blocks = option.code_lines;
	}
</script>

{#if (!algorithm && trait) || (!algorithm && fetched_trait)}
	{#if fetched_trait}
		<div class="holder">
			<CodeEditor
				height={lineCount * 18 + 18 + 'px'}
				defaultLanguage={language.editor_slug}
				onChange={handleEditorChange}
				defaultValue={fetched_trait.body}
				onMount={handleEditorDidMount}
				wordWrap={'on'}
				scrollBeyondLastLine={false}
				options={{
					minimap: { enabled: false }
				}}
			/>
		</div>
	{:else}
		<div class="holder">
			<CodeEditor
				height={lineCount * 18 + 18 + 'px'}
				defaultLanguage={language.editor_slug}
				onChange={handleEditorChange}
				defaultValue={''}
				onMount={handleEditorDidMount}
				wordWrap={'on'}
				scrollBeyondLastLine={false}
				options={{
					minimap: { enabled: false }
				}}
			/>
		</div>
	{/if}
{:else if algorithm}
	{#if showVideo && video_url}
		<div class="loom-holder">
			<i class="fa fa-times loom-close" on:click={() => (showVideo = false)} />
			<iframe
				src={video_url.replaceAll('share', 'embed')}
				frameborder="0"
				webkitallowfullscreen
				mozallowfullscreen
				allowfullscreen
				style="position: absolute; top: 0; left: 0; width: 100%; height: 300px;"
			/>
		</div>
	{/if}

	<div class="holder">
		{#if !showVideo && video_url}
			<div class="loom-open btn btn-outline-warning" on:click={() => (showVideo = true)}>
				<i class="fa fa-video" />
			</div>
		{/if}

		{#each blocks as block}
			<Block
				editable={1}
				{language}
				{block}
				update={(payload) => {
					// code = payload;
					console.log({ payload });
					console.log({ blocks });
					blocks = blocks.map((b, idx) => {
						if (b.id === block.id) {
							b.code = payload.code;
							b.disabled = payload.disabled;
						}
						return b;
					});
				}}
				removeCode={(payload) => {
					blocks = blocks.filter((b) => b.id !== payload.id);
				}}
			/>
		{/each}
	</div>

	{#if $user && $user.admin && !$loomifiedView}
		<div class="btn btn-primary" on:click={addBlock}><i class="fa fa-plus" /></div>
		<div class="btn btn-outline-warning" on:click={saveBlocks}><i class="fa fa-save" /></div>
		<div class="pull-right import btn btn-outline-primary" on:click={() => (blocks = [])}>
			<div class="fa fa-times" />
		</div>
		<div class="pull-right import btn btn-outline-primary" on:click={toggleImportOptions}>
			Import
		</div>

		{#if showImportMenu}
			<div class="import-menu">
				<ul class="clean-list">
					{#each importOptions || [] as option}
						<li>
							<div class="title" on:click={() => importLines(option)}>{option.algorithm.title}</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<input type="text" placeholder="Video Url..." class="form-control" bind:value={video_url} />
	{/if}
{/if}

{#if !algorithm}
	<div class="holder">
		<CodeEditor
			height={lineCount * 18 + 18 + 'px'}
			defaultLanguage={language.editor_slug}
			onChange={handleEditorChange}
			defaultValue={''}
			onMount={handleEditorDidMount}
			wordWrap={'on'}
			scrollBeyondLastLine={false}
			options={{
				minimap: { enabled: false }
			}}
		/>
	</div>
{/if}

{#if runnable}
	<div class="btn btn-info btn-block btn-lg" style="display:block;" on:click={test}>
		{#if !$user}
			<i class="fa fa-lock" /> Sign In To
		{/if}
		Run
	</div>

	{#if algorithm}
		<div class="test_cases">
			<TestCases {blocks} {algorithm} starter={mainStarter} {language} {testNow} {pass} />
		</div>
	{/if}

	{#if result}
		<div class="result">
			{@html result.output}
		</div>
	{/if}

	{#if error}
		<div class="error">
			Expecting: <span class="btn btn-warning expected-type"
				>{algorithm.expected.split(' ')[0]}</span
			>
			{algorithm.expected_with_type}
		</div>
	{/if}
{/if}

<style>
	.test_cases {
		padding: 10px;
	}
	.import {
		display: inline-block;
		/* position: relative; */
		/* right: 0; */
		float: right;
	}

	.import-menu {
		z-index: 999999;
		position: absolute;
		right: 0;
		background: #fff;
		padding: 20px;
		border-radius: 14px;
		border: 4px solid #ccc;
		right: 0;
	}
	.holder {
		padding: 12px;
		background: #fff;
		position: relative;
	}
	.result {
		padding: 10px;
		font-size: 24px;
		background: purple;
		color: #fff;
	}

	.error {
		padding: 10px;
		font-size: 24px;
		background: rgb(190, 5, 5);
		color: #fff;
	}

	.result {
		padding: 10px;
		font-size: 24px;
		background: purple;
		color: #fff;
	}

	.loom-holder {
		height: auto;
		width: auto;
		display: block;
		padding-bottom: 303px;
		position: relative;
		top: 0px;
		/* z-index: 999999; */
		background: #000;
	}

	.loom-open {
		position: absolute;
		top: -57px;
		left: -70px;
		font-size: 24px;
	}

	.loom-close {
		position: absolute;
		top: 10px;
		left: -40px;
		font-size: 34px;
	}

	@media (max-width: 480px) {
		.loom-open {
			right: 2px;
			left: auto;
		}

		.loom-close {
			right: 10px;
			left: auto;
			top: -48px;
			color: #fff;
		}
	}
</style>
