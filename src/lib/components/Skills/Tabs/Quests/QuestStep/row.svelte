<script>
	import { createEventDispatcher } from 'svelte';

	export let step;
	export let index;
	export let handleImageUpload;
	export let successNodeIn;
	export let selectSuccessNodeIn;
	export let selectSuccessNodeOut;

	const dispatch = createEventDispatcher();

	const emitEdit = () => dispatch('edit', step);
	const emitDelete = () => dispatch('delete', step.id);
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
		<input type="file" class="file-input" on:change={(e) => handleImageUpload(e, step)} />
	</td>

	<td>{step.body}</td>

	<td on:click={() => selectSuccessNodeIn(step)} class:node-selected={successNodeIn === step}>
		{step.success_step_id}
	</td>

	<td>{step.failure_step_id}</td>

	<td class="actions">
		<button class="btn-secondary" on:click={emitEdit}>Edit</button>
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

	.file-input {
		width: 100%;
		font-size: 0.875rem;
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

	td {
		vertical-align: middle;
	}
</style>
