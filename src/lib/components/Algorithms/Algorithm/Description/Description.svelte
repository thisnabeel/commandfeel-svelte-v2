<script>
	import Editor from 'cl-editor/src/Editor.svelte';
	import Update from '$lib/functions/debounce';
	export let algorithm;

	let pseudocoderOpen = false;
</script>

<div class="wrapper flex">
	<div class="editor">
		<Editor
			html={algorithm.challenge_body}
			on:change={(evt) => {
				const value = evt.detail;
				console.log('saving value', value);
				// save(key, value);
				Update(`/algorithms/${algorithm.id}.json`, {
					challenge_body: value
				});
			}}
		/>
	</div>
	<div class="pseudocoder">
		<Editor on:change={(evt) => {}} />
	</div>
</div>

<style>
	.wrapper {
		padding: 1em;
		border-radius: 8px;
		background: #fff;
	}

	.wrapper > div {
		margin: 10px;
	}

	.editor :global(.cl-content) {
		height: max-content !important;
	}

	.pseudocoder :global(.cl-content) {
		height: max-content !important;
	}

	.flex {
		display: flex;
	}

	.editor {
		flex: 1 1 60%;
	}

	.pseudocoder {
		flex: 1 1 40%;
	}
</style>
