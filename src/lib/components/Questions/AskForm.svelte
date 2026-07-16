<script>
	export let body = '';
	export let placeholder = 'Ask a question…';
	export let submitLabel = 'Ask';
	export let disabled = false;
	export let onSubmit = async (_text) => {};

	let text = '';
	let saving = false;
	let error = '';

	$: if (body !== undefined && body !== null && !saving) {
		/* keep local until submit */
	}

	async function submit() {
		const trimmed = (text || '').trim();
		if (!trimmed || disabled || saving) return;
		try {
			saving = true;
			error = '';
			await onSubmit(trimmed);
			text = '';
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not post question.';
		} finally {
			saving = false;
		}
	}
</script>

<form
	class="ask-form"
	on:submit|preventDefault={submit}
>
	{#if error}
		<p class="err" role="alert">{error}</p>
	{/if}
	<textarea
		rows="3"
		{placeholder}
		bind:value={text}
		disabled={disabled || saving}
	/>
	<button type="submit" disabled={disabled || saving || !(text || '').trim()}>
		{saving ? 'Posting…' : submitLabel}
	</button>
</form>

<style>
	.ask-form {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 0.65rem 0.75rem;
		border: 1px solid rgba(7, 65, 68, 0.18);
		border-radius: 8px;
		font-family: GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.95rem;
		line-height: 1.45;
		color: #071416;
		resize: vertical;
		min-height: 4.5rem;
	}

	button {
		align-self: flex-start;
		padding: 0.45rem 0.95rem;
		border: none;
		border-radius: 8px;
		background: #0a5f63;
		color: #f7fffe;
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.88rem;
		font-weight: 700;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.err {
		margin: 0;
		font-size: 0.88rem;
		color: #b02a37;
	}
</style>
