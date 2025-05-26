<script lang="ts">
	import { modals } from 'svelte-modals';
	import { OutClick } from 'svelte-outclick';
	import { onMount } from 'svelte';
	import { onBeforeClose } from 'svelte-modals';

	export let isOpen: boolean;
	export let step: { body: string };
	export let onSubmit: (prompt: string) => void;

	let selectedWords: string[] = [];
	let words: string[] = [];
	let customPrompt: string = '';

	$: prompt = 'modern cheery illustration style: ' + (customPrompt || selectedWords.join(' '));

	onMount(() => {
		document.body.style['overflow-y'] = 'hidden';
		// Split the step body into words and remove punctuation
		words = step.body
			.split(/\s+/)
			.map((word) => word.replace(/[.,!?;:]/g, ''))
			.filter((word) => word.length > 0);
	});

	onBeforeClose(() => {
		document.body.style['overflow-y'] = 'initial';
	});

	function handleWordClick(word: string) {
		if (selectedWords.includes(word)) {
			selectedWords = selectedWords.filter((w) => w !== word);
		} else {
			selectedWords = [...selectedWords, word];
		}
	}

	function handleSubmit() {
		if (prompt.length > 0) {
			onSubmit(prompt);
			modals.closeAll();
		}
	}

	const handleOutsideClick = () => {
		modals.closeAll();
	};
</script>

{#if isOpen}
	<div role="dialog" class="modal" on:click|stopPropagation>
		<div class="barrier" on:click|stopPropagation>
			<OutClick on:outclick={handleOutsideClick}>
				<div class="contents">
					<h2>Generate Image from Words</h2>
					<div class="selected-words">
						<div class="custom-prompt-input">
							<input
								type="text"
								bind:value={customPrompt}
								placeholder="Type your own prompt or select words below"
								class="form-control"
							/>
						</div>
						{#if selectedWords.length > 0 && !customPrompt}
							<p>Selected Prompt: <strong>{prompt}</strong></p>
						{:else if !customPrompt}
							<p>Type your own prompt above or click words below</p>
						{/if}
					</div>
					<div class="word-bank">
						{#each words as word}
							<button
								class="word-chip"
								class:selected={selectedWords.includes(word)}
								on:click={() => handleWordClick(word)}
							>
								{word}
							</button>
						{/each}
					</div>
					<div class="actions">
						<button class="btn btn-outline-secondary" on:click={() => modals.closeAll()}>
							Cancel
						</button>
						<button
							class="btn btn-success"
							on:click={handleSubmit}
							disabled={selectedWords.length === 0 && !customPrompt}
						>
							Generate Image
						</button>
					</div>
				</div>
			</OutClick>
		</div>
	</div>
{/if}

<style>
	.modal {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background: rgba(0, 0, 0, 0.5);
	}

	.contents {
		width: 800px;
		background: #fff;
		border-radius: 14px;
		padding: 2em;
		max-height: 90vh;
		overflow-y: auto;
	}

	h2 {
		text-align: center;
		margin-bottom: 1em;
	}

	.selected-words {
		background: #f8f9fa;
		padding: 1em;
		border-radius: 8px;
		margin-bottom: 1em;
		text-align: center;
	}

	.word-bank {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
		margin-bottom: 2em;
		padding: 1em;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.word-chip {
		padding: 0.5em 1em;
		border: 1px solid #dee2e6;
		border-radius: 20px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.word-chip:hover {
		background: #e9ecef;
	}

	.word-chip.selected {
		background: #28a745;
		color: white;
		border-color: #28a745;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 1em;
	}

	.custom-prompt-input {
		margin-bottom: 1em;
	}

	.custom-prompt-input input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		font-size: 1rem;
	}

	.custom-prompt-input input:focus {
		outline: none;
		border-color: #28a745;
		box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
	}
</style>
