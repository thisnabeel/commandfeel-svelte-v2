<script>
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';

	let firstName = ($user?.first_name || '').trim();
	let lastName = ($user?.last_name || '').trim();
	let error = '';
	let saving = false;

	async function save() {
		const first = (firstName || '').trim();
		const last = (lastName || '').trim();
		if (!first || !last) {
			error = 'Please enter both your first and last name.';
			return;
		}
		try {
			saving = true;
			error = '';
			const updated = await Api.patch('/users/profile', {
				user: { first_name: first, last_name: last }
			});
			user.set({
				...$user,
				...updated,
				generated_token: updated.generated_token || $user.generated_token
			});
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not save your name.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="gate" role="dialog" aria-modal="true" aria-labelledby="name-gate-title">
	<div class="panel">
		<p class="eyebrow">Almost there</p>
		<h2 id="name-gate-title">What’s your name?</h2>
		<p class="lede">
			We need your first and last name before you continue. This appears in your cohort profile and
			team workspace.
		</p>

		{#if error}
			<div class="error" role="alert">{error}</div>
		{/if}

		<label for="gate-first">First name</label>
		<input id="gate-first" type="text" bind:value={firstName} autocomplete="given-name" />

		<label for="gate-last">Last name</label>
		<input id="gate-last" type="text" bind:value={lastName} autocomplete="family-name" />

		<button type="button" disabled={saving} on:click={save}>
			{saving ? 'Saving…' : 'Continue'}
		</button>
	</div>
</div>

<style>
	.gate {
		position: fixed;
		inset: 0;
		z-index: 10050;
		display: grid;
		place-items: center;
		padding: 1.25rem;
		background: rgba(7, 20, 22, 0.62);
		backdrop-filter: blur(6px);
	}

	.panel {
		width: min(420px, 100%);
		background: #fbfffe;
		border: 1px solid rgba(7, 65, 68, 0.14);
		border-radius: 16px;
		padding: 1.75rem 1.6rem 1.5rem;
		box-shadow: 0 24px 50px -28px rgba(7, 20, 22, 0.55);
	}

	.eyebrow {
		margin: 0 0 0.4rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #0a5f63;
	}

	h2 {
		margin: 0;
		font-family: Fraunces, Georgia, serif;
		font-size: 1.7rem;
		font-weight: 500;
		color: #071416;
		text-align: left;
	}

	.lede {
		margin: 0.65rem 0 1.25rem;
		font-size: 0.98rem;
		line-height: 1.45;
		color: #3a545c;
	}

	.error {
		margin-bottom: 0.85rem;
		padding: 0.55rem 0.7rem;
		border-radius: 6px;
		background: #fdecea;
		color: #b02a37;
		font-size: 0.9rem;
	}

	label {
		display: block;
		font-size: 0.85rem;
		font-weight: 700;
		color: #071416;
		margin-bottom: 0.3rem;
	}

	input {
		width: 100%;
		margin-bottom: 0.9rem;
		padding: 0.55rem 0.75rem;
		border: 1px solid #ced4da;
		border-radius: 6px;
		font-size: 1rem;
		color: #313131;
		box-sizing: border-box;
	}

	button {
		width: 100%;
		margin-top: 0.35rem;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 8px;
		background: #0a5f63;
		color: #f7fffe;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	button:hover:not(:disabled) {
		background: #074144;
	}
</style>
