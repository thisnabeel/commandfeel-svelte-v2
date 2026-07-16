<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { user, credsView } from '$lib/stores/user';

	export let occupationSkillId;
	export let cohortId = null;
	export let onStatusChange = (_hasApproved) => {};

	let items = [];
	let loading = true;
	let error = '';
	let body = '';
	let saving = false;
	/** @type {Record<number|string, string>} */
	let adminComments = {};
	/** @type {number|string|null} */
	let approvingId = null;

	$: isAdmin = !!$user?.admin;
	$: hasApproved = items.some((e) => e.approved);

	function openSignIn() {
		credsView.set('signIn');
	}

	function emitStatus() {
		onStatusChange(hasApproved);
	}

	async function load() {
		if (!$user || !occupationSkillId) {
			items = [];
			loading = false;
			emitStatus();
			return;
		}
		try {
			loading = true;
			error = '';
			const list = await Api.get(
				`/occupation_skills/${occupationSkillId}/occupation_skill_evidences`
			);
			items = Array.isArray(list) ? list : [];
			emitStatus();
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to load evidence';
			items = [];
			emitStatus();
		} finally {
			loading = false;
		}
	}

	async function submit() {
		const trimmed = (body || '').trim();
		if (!trimmed || saving || !$user) return;
		try {
			saving = true;
			error = '';
			const payload = { occupation_skill_evidence: { body: trimmed } };
			if (cohortId) payload.occupation_skill_evidence.cohort_id = cohortId;
			const created = await Api.post(
				`/occupation_skills/${occupationSkillId}/occupation_skill_evidences`,
				payload
			);
			items = [created, ...items];
			body = '';
			emitStatus();
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not save evidence.';
		} finally {
			saving = false;
		}
	}

	async function approve(ev) {
		if (!isAdmin || approvingId) return;
		try {
			approvingId = ev.id;
			error = '';
			const comment = (adminComments[ev.id] || '').trim();
			const updated = await Api.patch(`/occupation_skill_evidences/${ev.id}`, {
				occupation_skill_evidence: {
					approved: true,
					comment: comment || null
				}
			});
			items = items.map((e) => (e.id === updated.id ? updated : e));
			emitStatus();
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not approve.';
		} finally {
			approvingId = null;
		}
	}

	async function unapprove(ev) {
		if (!isAdmin || approvingId) return;
		try {
			approvingId = ev.id;
			error = '';
			const updated = await Api.patch(`/occupation_skill_evidences/${ev.id}`, {
				occupation_skill_evidence: { approved: false, comment: null }
			});
			items = items.map((e) => (e.id === updated.id ? updated : e));
			adminComments = { ...adminComments, [ev.id]: '' };
			emitStatus();
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not update.';
		} finally {
			approvingId = null;
		}
	}

	function formatWhen(iso) {
		if (!iso) return '';
		try {
			return new Date(iso).toLocaleString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return '';
		}
	}

	onMount(load);

	let lastKey = undefined;
	$: {
		const key = `${$user?.id ?? 'anon'}:${occupationSkillId}`;
		if (key !== lastKey) {
			lastKey = key;
			load();
		}
	}
</script>

<div class="panel">
	{#if !$user}
		<div class="gate">
			<p>Sign in to add evidence for this skill.</p>
			<button type="button" on:click={openSignIn}>Sign in</button>
		</div>
	{:else}
		{#if !isAdmin}
			<form class="compose" on:submit|preventDefault={submit}>
				<textarea
					rows="3"
					placeholder="Describe or paste evidence (link, screenshot note, project detail…)"
					bind:value={body}
					disabled={saving}
				/>
				<button type="submit" disabled={saving || !(body || '').trim()}>
					{saving ? 'Saving…' : 'Add evidence'}
				</button>
			</form>
		{/if}

		{#if error}
			<p class="err" role="alert">{error}</p>
		{/if}

		{#if loading}
			<p class="status">Loading…</p>
		{:else if items.length === 0}
			<p class="status">
				{isAdmin ? 'No evidence submitted for this skill yet.' : 'No evidence yet. Add your first piece above.'}
			</p>
		{:else}
			<ul class="list">
				{#each items as ev (ev.id)}
					<li class="card" class:approved={ev.approved}>
						<div class="card-head">
							{#if ev.approved}
								<span class="check" title="Approved" aria-label="Approved">
									<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
										<path
											fill="currentColor"
											d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
										/>
									</svg>
								</span>
							{/if}
							<span class="who">{ev.user_display_name || 'User'}</span>
							{#if ev.created_at}
								<span class="when">· {formatWhen(ev.created_at)}</span>
							{/if}
							{#if ev.approved}
								<span class="pill">Approved</span>
							{:else}
								<span class="pill pending">Pending</span>
							{/if}
						</div>
						<p class="body">{ev.body}</p>
						{#if ev.approved && ev.comment}
							<p class="admin-note">
								<span>Admin</span>
								{ev.comment}
							</p>
						{/if}
						{#if isAdmin}
							{#if ev.approved}
								<button
									type="button"
									class="ghost"
									disabled={approvingId === ev.id}
									on:click={() => unapprove(ev)}
								>
									Revoke approval
								</button>
							{:else}
								<div class="admin-actions">
									<input
										type="text"
										placeholder="Optional comment…"
										value={adminComments[ev.id] || ''}
										disabled={approvingId === ev.id}
										on:input={(e) => {
											adminComments = {
												...adminComments,
												[ev.id]: e.currentTarget.value
											};
										}}
									/>
									<button
										type="button"
										disabled={approvingId === ev.id}
										on:click={() => approve(ev)}
									>
										{approvingId === ev.id ? 'Saving…' : 'Approve'}
									</button>
								</div>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.compose {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(7, 65, 68, 0.08);
	}

	.compose textarea,
	.admin-actions input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0.65rem;
		border: 1px solid rgba(7, 65, 68, 0.18);
		border-radius: 8px;
		font: inherit;
		font-size: 0.9rem;
		resize: vertical;
	}

	.compose button,
	.admin-actions button {
		align-self: flex-start;
		padding: 0.4rem 0.85rem;
		border: none;
		border-radius: 8px;
		background: #0a5f63;
		color: #fff;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.compose button:disabled,
	.admin-actions button:disabled,
	.ghost:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.card {
		padding: 0.7rem 0.8rem;
		border-radius: 10px;
		border: 1px solid rgba(7, 65, 68, 0.12);
		background: #fbfffe;
	}

	.card.approved {
		border-color: rgba(5, 150, 105, 0.35);
		background: #f0fdf4;
	}

	.card-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3rem 0.4rem;
		margin-bottom: 0.4rem;
	}

	.check {
		display: inline-flex;
		color: #059669;
	}

	.who {
		font-size: 0.8rem;
		font-weight: 700;
		color: #0a5f63;
	}

	.when {
		font-size: 0.75rem;
		color: #3a545c;
	}

	.pill {
		margin-left: auto;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #065f46;
		background: #d1fae5;
		padding: 0.12rem 0.4rem;
		border-radius: 999px;
	}

	.pill.pending {
		color: #92400e;
		background: #fef3c7;
	}

	.body {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.45;
		color: #071416;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.admin-note {
		margin: 0.5rem 0 0;
		padding: 0.45rem 0.55rem;
		border-radius: 8px;
		background: rgba(5, 150, 105, 0.08);
		font-size: 0.85rem;
		color: #065f46;
		line-height: 1.4;
	}

	.admin-note span {
		font-weight: 700;
		margin-right: 0.35rem;
	}

	.admin-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 0.55rem;
		align-items: center;
	}

	.admin-actions input {
		flex: 1;
		min-width: 10rem;
	}

	.ghost {
		margin-top: 0.5rem;
		border: 1px solid rgba(10, 95, 99, 0.3);
		background: #fff;
		color: #0a5f63;
		padding: 0.35rem 0.7rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.status {
		margin: 0;
		font-size: 0.9rem;
		color: #3a545c;
	}

	.err {
		margin: 0;
		font-size: 0.85rem;
		color: #b02a37;
	}

	.gate {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.65rem;
	}

	.gate p {
		margin: 0;
		color: #3a545c;
	}

	.gate button {
		padding: 0.45rem 0.9rem;
		border: none;
		border-radius: 8px;
		background: #0a5f63;
		color: #fff;
		font-weight: 700;
		cursor: pointer;
	}
</style>
