<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';

	export let cohortId = null;
	export let onChange = (_list) => {};

	let items = [];
	let loading = true;
	let error = '';
	/** @type {Record<number|string, string>} */
	let adminComments = {};
	/** @type {number|string|null} */
	let approvingId = null;

	function emitChange(list) {
		onChange(Array.isArray(list) ? list : []);
	}

	async function load() {
		if (!$user?.admin || !cohortId) {
			items = [];
			loading = false;
			emitChange([]);
			return;
		}
		try {
			loading = true;
			error = '';
			const list = await Api.get(
				`/occupation_skill_evidences/pending?cohort_id=${cohortId}`
			);
			items = Array.isArray(list) ? list : [];
			emitChange(items);
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to load pending evidence';
			items = [];
			emitChange([]);
		} finally {
			loading = false;
		}
	}

	async function approve(ev) {
		if (approvingId) return;
		try {
			approvingId = ev.id;
			error = '';
			const comment = (adminComments[ev.id] || '').trim();
			await Api.patch(`/occupation_skill_evidences/${ev.id}`, {
				occupation_skill_evidence: {
					approved: true,
					comment: comment || null
				}
			});
			items = items.filter((e) => e.id !== ev.id);
			emitChange(items);
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
		const key = `${$user?.id ?? 'anon'}:${cohortId || ''}`;
		if (key !== lastKey) {
			lastKey = key;
			load();
		}
	}
</script>

<div class="panel">
	{#if !$user?.admin}
		<p class="status">Admin access required.</p>
	{:else if loading}
		<p class="status">Loading…</p>
	{:else if error}
		<p class="status err" role="alert">{error}</p>
	{:else if items.length === 0}
		<p class="status">No pending evidence for this cohort.</p>
	{:else}
		<ul class="list">
			{#each items as ev (ev.id)}
				<li class="card">
					<div class="card-head">
						<span class="skill">{ev.skill_label || 'Skill'}</span>
						<span class="pill">Pending</span>
					</div>
					<p class="meta">
						{ev.user_display_name || 'User'}
						{#if ev.created_at}
							· {formatWhen(ev.created_at)}
						{/if}
					</p>
					<p class="body">{ev.body}</p>
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
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.card {
		padding: 0.85rem 0.95rem;
		border-radius: 10px;
		border: 1px solid rgba(245, 158, 11, 0.35);
		background: #fffbeb;
	}

	.card-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
		margin-bottom: 0.35rem;
	}

	.skill {
		font-family: 'Space Grotesk', system-ui, sans-serif;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #0a5f63;
	}

	.pill {
		margin-left: auto;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #92400e;
		background: #fef3c7;
		padding: 0.12rem 0.4rem;
		border-radius: 999px;
	}

	.meta {
		margin: 0 0 0.4rem;
		font-size: 0.78rem;
		color: #3a545c;
	}

	.body {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.45;
		color: #071416;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.admin-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 0.65rem;
		align-items: center;
	}

	.admin-actions input {
		flex: 1;
		min-width: 10rem;
		box-sizing: border-box;
		padding: 0.45rem 0.65rem;
		border: 1px solid rgba(7, 65, 68, 0.18);
		border-radius: 8px;
		font: inherit;
		font-size: 0.9rem;
		background: #fff;
	}

	.admin-actions button {
		padding: 0.4rem 0.85rem;
		border: none;
		border-radius: 8px;
		background: #0a5f63;
		color: #fff;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.admin-actions button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.status {
		margin: 0;
		font-size: 0.92rem;
		color: #3a545c;
	}

	.status.err {
		color: #b02a37;
	}
</style>
