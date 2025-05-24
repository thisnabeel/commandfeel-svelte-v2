<script lang="ts">
	import { onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	let monaco: typeof import('$lib/monaco').default;

	export let height: string = '600px';
	export let defaultLanguage: string = 'javascript';
	export let defaultValue: string = '';
	export let wordWrap: 'on' | 'off' = 'off';
	export let scrollBeyondLastLine: boolean = true;
	export let automaticLayout: boolean = true;
	export let lineNumbers: 'on' | 'off' = 'on';
	export let options: Monaco.editor.IStandaloneEditorConstructionOptions = {};

	export let onChange: (value: string) => void = () => {};
	export let onMount: (editor: Monaco.editor.IStandaloneCodeEditor) => void = () => {};

	let editorContainer: HTMLElement;
	let editor: Monaco.editor.IStandaloneCodeEditor;

	const dispatch = createEventDispatcher();

	$: {
		if (browser && editorContainer) {
			initEditor();
		}
	}

	async function initEditor() {
		// Dynamically import monaco only on the client side
		monaco = (await import('$lib/monaco')).default;

		const model = monaco.editor.createModel(defaultValue, defaultLanguage);

		editor = monaco.editor.create(editorContainer, {
			model,
			theme: 'vs-dark',
			wordWrap,
			scrollBeyondLastLine,
			automaticLayout,
			lineNumbers,
			minimap: { enabled: false },
			...options
		});

		editor.onDidChangeModelContent(() => {
			const value = editor.getValue();
			onChange(value);
			dispatch('change', value);
		});

		onMount(editor);
	}

	onDestroy(() => {
		if (browser) {
			editor?.dispose();
			monaco?.editor.getModels().forEach((model) => model.dispose());
		}
	});
</script>

<div bind:this={editorContainer} class="editor" style="height: {height};"></div>

<style>
	.editor {
		width: 100%;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
