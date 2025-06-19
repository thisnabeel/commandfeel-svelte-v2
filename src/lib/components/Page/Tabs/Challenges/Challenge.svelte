<script>
	import Api from '$lib/api/api';

	import { user } from '$lib/stores/user';

	import { modals } from 'svelte-modals';
	import SubmitterModal from '$lib/modals/challenges/submitter.svelte';
	import CodeCompiler from '$lib/components/CodeCompiler/Box.svelte';
	import Editor from '$lib/components/CodeCompiler/Box.svelte';
	import CodeBox from '$lib/components/CodeCompiler/Box.svelte';
	import API from '$lib/api/api';
	import { Editor as TipTapEditor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy } from 'svelte';

	export let refresh = () => {};
	export let element = null;
	export let elementType;
	export let challenge;
	export let destroy;
	export let editable = false;
	export let codable = false;
	export let language;

	let input;
	let html;
	let timer;
	let expand;
	let output;
	let editor;
	let editorElement;

	let generatingResumePoints = false;

	let selectedResumePoint = null;

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	const debounce = (v) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const response = await Api.put('/challenges/' + challenge.id + '.json', {
				title: v,
				method: '_post'
			});
			console.log('response', response);
		}, 1000);
	};

	async function runCode(code) {
		console.log({ code });

		const res = await API.post(`/programming_languages/${language.id}/execute.json`, {
			code: code,
			language: language
		});

		console.log({ res });

		output = res.output;
	}

	async function handleEditorUpdate({ editor }) {
		const html = editor.getHTML();
		const response = await Api.put('/challenges/' + challenge.id + '.json', {
			body: html
		});
		console.log({ response });
	}

	async function generateResumePoints() {
		try {
			generatingResumePoints = true;
			const response = await Api.get(`/challenges/${challenge.id}/resume_points/wizard`);
			challenge.resume_points = response;
		} catch (error) {
			console.error('Failed to generate resume points:', error);
		} finally {
			generatingResumePoints = false;
		}
	}

	$: if (expand && editorElement && $user?.admin) {
		editor = new TipTapEditor({
			element: editorElement,
			extensions: [StarterKit],
			content: challenge.body,
			onUpdate: handleEditorUpdate
		});
	}
</script>

<li class:has_video={challenge && challenge.preview}>
	{#if $user && $user.admin === true}
		<span contenteditable on:keyup={(e) => debounce(event.target.innerHTML)}
			>{@html challenge.title}</span
		>
		{#if !editable}
			<span class="fa fa-trash" on:click={() => destroy(challenge.id)} />
		{/if}
	{:else}
		<span>{@html challenge.title}</span>
	{/if}
	<div class="action-buttons">
		<button
			class="btn btn-outline-primary btn-sm resume-wizard"
			on:click={generateResumePoints}
			disabled={generatingResumePoints}
		>
			{#if generatingResumePoints}
				<i class="fa fa-spinner fa-spin" />
			{:else}
				<i class="fa fa-magic" />
			{/if}
		</button>
		<span class="fa fa-expand" on:click={() => (expand = !expand)} />
	</div>
	{#if expand}
		<div>
			{#if !codable}
				<hr />
				<div
					class="btn btn-block btn-primary"
					on:click={() => {
						modals.open(SubmitterModal, {
							challenge: challenge
						});
					}}
				>
					<i class="fa fa-document" /> Submit Proof
				</div>
			{/if}
			<hr />
			<div class="body">
				{#if $user?.admin}
					<div class="editor-toolbar">
						<button
							class="toolbar-btn"
							class:active={editor?.isActive('heading', { level: 1 })}
							on:click={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
						>
							H1
						</button>
						<button
							class="toolbar-btn"
							class:active={editor?.isActive('heading', { level: 2 })}
							on:click={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
						>
							H2
						</button>
						<button
							class="toolbar-btn"
							class:active={editor?.isActive('bold')}
							on:click={() => editor?.chain().focus().toggleBold().run()}
						>
							<i class="fa fa-bold" />
						</button>
						<button
							class="toolbar-btn"
							class:active={editor?.isActive('italic')}
							on:click={() => editor?.chain().focus().toggleItalic().run()}
						>
							<i class="fa fa-italic" />
						</button>
						<button
							class="toolbar-btn"
							class:active={editor?.isActive('bulletList')}
							on:click={() => editor?.chain().focus().toggleBulletList().run()}
						>
							<i class="fa fa-list-ul" />
						</button>
						<button
							class="toolbar-btn"
							class:active={editor?.isActive('orderedList')}
							on:click={() => editor?.chain().focus().toggleOrderedList().run()}
						>
							<i class="fa fa-list-ol" />
						</button>
						<button
							class="toolbar-btn"
							class:active={editor?.isActive('code')}
							on:click={() => editor?.chain().focus().toggleCode().run()}
						>
							<i class="fa fa-code" />
						</button>
						<button class="toolbar-btn" on:click={() => editor?.chain().focus().undo().run()}>
							<i class="fa fa-undo" />
						</button>
						<button class="toolbar-btn" on:click={() => editor?.chain().focus().redo().run()}>
							<i class="fa fa-redo" />
						</button>
					</div>
					<div class="editor-content" bind:this={editorElement} />
				{:else}
					{@html challenge.body}
				{/if}
			</div>

			{#if codable && language}
				<CodeBox
					{language}
					runClicked={(code) => {
						runCode(code);
					}}
					runnable={true}
					pass={() => {}}
				/>

				{#if output}
					<div class="output">{@html output}</div>
				{/if}
			{/if}
		</div>
	{/if}
	{#if challenge.resume_points}
		<div class="resume-points">
			<ul>
				{#each challenge.resume_points as point}
					<li
						on:click={() => (selectedResumePoint = selectedResumePoint === point ? null : point)}
						class:selected={selectedResumePoint === point}
					>
						{point.body.split(' ')[0]}...
					</li>
				{/each}
			</ul>
			{#if selectedResumePoint}
				<div class="expanded-point">
					{selectedResumePoint.body}
				</div>
			{/if}
		</div>
	{/if}
	<div class:hidden={!challenge.preview} class="abstra-play">
		<img class="abstra-preview" src={challenge.preview} />
	</div>
</li>

<style>
	.body {
		font-family: GreyCliffCF-Light;
	}
	.hidden {
		display: none;
	}

	li {
		list-style: none;
		padding: 30px;
		position: relative;
		margin-bottom: 10px;
		background: #7ff7ff;
	}

	.action-buttons {
		position: absolute;
		right: -7%;
		top: 39%;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.resume-wizard {
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}

	.fa-trash {
		position: absolute;
		left: -7%;
		top: 39%;
	}

	.fa-expand {
		cursor: pointer;
	}

	.abstra-play {
		position: absolute;
		right: -122px;
		top: 14%;
		cursor: pointer;
		width: 130px;
		background: #ffd67f;
		padding: 50px;
		border-radius: 10px;
	}

	.abstra-preview {
		position: absolute;
		top: 12%;
		left: -6%;
		border-radius: 10px;
		max-width: 100%;
		z-index: 100;
	}

	.editor-toolbar {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border: 1px solid #ddd;
		border-bottom: none;
		border-radius: 4px 4px 0 0;
	}

	.toolbar-btn {
		padding: 0.5rem;
		background: none;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		color: #666;
		font-size: 0.9rem;
	}

	.toolbar-btn:hover {
		background: #e9ecef;
	}

	.toolbar-btn.active {
		background: #e9ecef;
		color: #007bff;
		border-color: #ddd;
	}

	.editor-content {
		border: 1px solid #ddd;
		border-radius: 0 0 4px 4px;
		padding: 1rem;
		min-height: 200px;
	}

	.editor-content :global(.ProseMirror) {
		outline: none;
	}

	.editor-content :global(.ProseMirror p) {
		margin: 0.5rem 0;
	}

	.resume-points {
		margin-top: 1.5rem;
		padding: 1rem;
	}

	.resume-points h4 {
		margin-bottom: 1rem;
		color: #333;
	}

	.resume-points ul {
		list-style: none;
		padding: 0;
		margin: 0;
		overflow-x: scroll;
		width: 100%;
		text-wrap-mode: nowrap;
	}

	.resume-points li {
		margin: 0;
		display: inline-block;
		margin-right: 10px;
		background: #f8f9fa;
		border-radius: 10px;
		padding: 12px;
		font-size: 14px;
	}

	.resume-points .position {
		color: #666;
		font-weight: 500;
	}

	.resume-points .expanded-point {
		margin-top: 10px;
		padding: 10px;
		background: #f8f9fa;
		border-radius: 10px;
	}

	.resume-points li.selected {
		background: #000;
		color: #fff;
	}

	@media (max-width: 480px) {
		.abstra-play {
			position: absolute;
			right: 0;
			left: 0;
			margin: 0 auto;
			top: -83px;
			cursor: pointer;
			padding: 55px;
			width: 7.5em;
		}

		.abstra-preview {
			position: absolute;
			top: 9px;
			left: 5px;
			border-radius: 10px;
			max-width: 170px;
		}

		.challenges {
			width: 100%;
		}

		.challenges .has_video {
			padding-top: 55px;
		}

		.action-buttons {
			right: 10px;
		}

		.editor-toolbar {
			flex-wrap: wrap;
		}
	}

	.output {
		padding: 10px;
		font-size: 24px;
		background: #000;
		color: #fff;
		border-radius: 8px;
		margin-top: 14px;
	}
</style>
