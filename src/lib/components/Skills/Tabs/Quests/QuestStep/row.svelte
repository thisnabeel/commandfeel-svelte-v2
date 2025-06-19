<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { modals } from 'svelte-modals';
	import ImageGeneratorModal from './ImageGeneratorModal.svelte';
	import Swal from 'sweetalert2';

	interface Step {
		id: number;
		position: number;
		body: string;
		image_url?: string;
		success_step_id?: number;
		failure_step_id?: number;
	}

	interface ImageUploadEvent {
		target: {
			files: FileList;
		};
	}

	export let step: Step;
	export let index: number;
	export let handleImageUpload: (event: ImageUploadEvent, step: Step) => void;
	export let successNodeIn: Step | null;
	export let selectSuccessNodeIn: (step: Step) => void;
	export let selectSuccessNodeOut: (step: Step) => void;

	const dispatch = createEventDispatcher();

	const emitEdit = () => dispatch('edit', step);
	const emitDelete = () => dispatch('delete', step.id);
	const emitToggleChoices = () => dispatch('toggleChoicesManagement', step);

	async function generateImage(prompt: string) {
		try {
			Swal.fire({
				title: 'Generating Image...',
				text: 'This may take a few moments',
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				}
			});

			const response = await fetch('/api/replicate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ prompt })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to generate image');
			}

			// Show the generated image and ask for confirmation
			const result = await Swal.fire({
				title: 'Generated Image',
				imageUrl: data.imageUrl,
				imageWidth: 400,
				imageHeight: 400,
				showCancelButton: true,
				confirmButtonText: 'Use this image',
				cancelButtonText: 'Try again'
			});

			if (result.isConfirmed) {
				// Create a fake file event to use the existing image upload handler
				const response = await fetch(data.imageUrl);
				const blob = await response.blob();
				const file = new File([blob], 'generated-image.png', { type: 'image/png' });

				const event = {
					target: {
						files: [file] as unknown as FileList
					}
				} as ImageUploadEvent;

				handleImageUpload(event, step);
				modals.close();
			}
		} catch (error) {
			console.error('Error generating image:', error);
			Swal.fire({
				icon: 'error',
				title: 'Oops...',
				text: error instanceof Error ? error.message : 'Failed to generate image'
			});
		}
	}

	function openImageGenerator() {
		modals.open(ImageGeneratorModal, {
			step,
			onSubmit: generateImage
		});
	}
</script>

<tr>
	<td>
		{#if successNodeIn}
			<div
				class="btn-link"
				on:click={() => {
					selectSuccessNodeOut(step);
				}}
			>
				🔗
			</div>
		{/if}
		{step.position}
	</td>

	<td class="image-cell">
		{#if step.image_url}
			<img src={step.image_url} alt="Step Image" class="preview-image" />
		{/if}
		<div class="image-actions">
			<input type="file" class="file-input" on:change={(e) => handleImageUpload(e, step)} />
			<button class="btn-generate" on:click={openImageGenerator}>
				<i class="fa fa-bolt"></i>
			</button>
		</div>
	</td>

	<td>{step.body}</td>

	<td on:click={() => selectSuccessNodeIn(step)} class:node-selected={successNodeIn === step}>
		{step.success_step_id}
	</td>

	<td>{step.failure_step_id}</td>

	<td class="actions">
		<button class="btn-secondary" on:click={emitEdit}>Edit</button>
		<button class="btn-info" on:click={emitToggleChoices}>Choices</button>
		<button class="btn-danger" on:click={emitDelete}>Delete</button>
	</td>
</tr>

<style>
	.image-cell {
		width: 150px;
		text-align: center;
	}

	.preview-image {
		max-width: 100px;
		border-radius: 6px;
		margin-bottom: 0.5rem;
	}

	.image-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
	}

	.file-input {
		width: calc(100% - 40px);
		font-size: 0.875rem;
	}

	.btn-generate {
		background: #ffd700;
		color: #000;
		border: none;
		border-radius: 4px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-generate:hover {
		background: #ffed4a;
		transform: scale(1.05);
	}

	.btn-link {
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.btn-link:hover {
		background-color: #e9ecef;
	}

	.node-selected {
		background-color: #e9ecef;
		cursor: pointer;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-info {
		background: #17a2b8;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.btn-info:hover {
		background: #138496;
	}

	td {
		vertical-align: middle;
	}
</style>
