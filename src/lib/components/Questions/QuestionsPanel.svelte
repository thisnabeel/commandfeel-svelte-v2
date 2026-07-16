<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { user, credsView } from '$lib/stores/user';
	import AskForm from './AskForm.svelte';
	import QuestionThread from './QuestionThread.svelte';
	import { countBadgeWorthy, sameUserId } from '$lib/questions/badgeCounts.js';

	/** @type {'OccupationSkill' | 'CohortUser'} */
	export let questionableType = null;
	export let questionableId = null;
	/** When set, load aggregated mine list instead of skill-scoped list */
	export let cohortUserId = null;
	/** Admin: load unresolved questions for everyone in this cohort */
	export let cohortId = null;
	export let unresolvedOnly = false;
	export let allowAsk = true;
	export let emptyLabel = 'No questions yet.';
	export let onChange = (_questions) => {};

	/** @type {'unresolved' | 'resolved'} */
	let statusFilter = 'unresolved';
	let questions = [];
	let loading = true;
	let error = '';

	$: showStatusTabs = !unresolvedOnly && questions.length > 0;
	$: unresolvedCount = countBadgeWorthy(questions, $user, { asAdmin: false });
	$: resolvedCount = questions.filter((q) => q.resolved).length;
	$: visibleQuestions = unresolvedOnly
		? questions
		: questions.filter((q) => (statusFilter === 'resolved' ? q.resolved : !q.resolved));
	$: emptyForFilter =
		statusFilter === 'resolved' ? 'No resolved questions yet.' : 'No unresolved questions.';

	function openSignIn() {
		credsView.set('signIn');
	}

	function emitChange(list) {
		onChange(Array.isArray(list) ? list : []);
	}

	async function load() {
		if (!$user) {
			questions = [];
			loading = false;
			emitChange([]);
			return;
		}
		try {
			loading = true;
			error = '';
			if (unresolvedOnly && cohortId) {
				questions = await Api.get(`/questions/cohort_unresolved?cohort_id=${cohortId}`);
			} else if (cohortUserId) {
				questions = await Api.get(`/questions/mine?cohort_user_id=${cohortUserId}`);
			} else if (questionableType === 'OccupationSkill' && questionableId) {
				questions = await Api.get(`/occupation_skills/${questionableId}/questions`);
			} else {
				questions = [];
			}
			if (!Array.isArray(questions)) questions = [];
			emitChange(questions);
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to load questions';
			questions = [];
			emitChange([]);
		} finally {
			loading = false;
		}
	}

	async function ask(body) {
		const created = await Api.post('/questions', {
			question: {
				body,
				questionable_type: questionableType,
				questionable_id: questionableId
			}
		});
		questions = [created, ...questions];
		statusFilter = 'unresolved';
		emitChange(questions);
	}

	function onUpdated(updated) {
		if (unresolvedOnly) {
			if (updated?.resolved || sameUserId(updated?.last_comment_by_id, $user?.id)) {
				questions = questions.filter((q) => q.id !== updated.id);
			} else {
				questions = questions.map((q) => (q.id === updated.id ? updated : q));
			}
		} else {
			questions = questions.map((q) => (q.id === updated.id ? updated : q));
		}
		emitChange(questions);
	}

	onMount(load);

	let lastKey = undefined;
	$: {
		const key = `${$user?.id ?? 'anon'}:${cohortId || ''}:${cohortUserId || ''}:${questionableId || ''}:${unresolvedOnly}`;
		if (key !== lastKey) {
			lastKey = key;
			load();
		}
	}
</script>

<div class="panel">
	{#if !$user}
		<div class="gate">
			<p>Sign in to ask questions.</p>
			<button type="button" on:click={openSignIn}>Sign in</button>
		</div>
	{:else}
		{#if allowAsk && questionableType && questionableId}
			<div class="compose">
				<AskForm onSubmit={ask} placeholder="Ask a question…" />
			</div>
		{/if}

		{#if showStatusTabs}
			<div class="status-tabs" role="tablist" aria-label="Question status">
				<button
					type="button"
					class="status-tab"
					class:active={statusFilter === 'unresolved'}
					role="tab"
					aria-selected={statusFilter === 'unresolved'}
					on:click={() => (statusFilter = 'unresolved')}
				>
					Unresolved
					{#if unresolvedCount > 0}
						<span class="count">{unresolvedCount > 99 ? '99+' : unresolvedCount}</span>
					{/if}
				</button>
				<button
					type="button"
					class="status-tab"
					class:active={statusFilter === 'resolved'}
					role="tab"
					aria-selected={statusFilter === 'resolved'}
					on:click={() => (statusFilter = 'resolved')}
				>
					Resolved
					{#if resolvedCount > 0}
						<span class="count muted">{resolvedCount > 99 ? '99+' : resolvedCount}</span>
					{/if}
				</button>
			</div>
		{/if}

		{#if loading}
			<p class="status">Loading…</p>
		{:else if error}
			<p class="status err">{error}</p>
		{:else if questions.length === 0}
			<p class="status">{emptyLabel}</p>
		{:else if visibleQuestions.length === 0}
			<p class="status">{emptyForFilter}</p>
		{:else}
			<ul class="list">
				{#each visibleQuestions as q (q.id)}
					<li>
						<QuestionThread question={q} {onUpdated} />
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
		gap: 1rem;
	}

	.compose {
		padding-bottom: 0.25rem;
		border-bottom: 1px solid rgba(7, 65, 68, 0.08);
	}

	.status-tabs {
		display: flex;
		gap: 0.35rem;
		padding: 0.2rem;
		background: rgba(7, 65, 68, 0.05);
		border-radius: 10px;
		width: fit-content;
		max-width: 100%;
	}

	.status-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.85rem;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: #3a545c;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.status-tab:hover {
		color: #071416;
	}

	.status-tab.active {
		background: #fff;
		color: #0a5f63;
		box-shadow: 0 1px 2px rgba(7, 65, 68, 0.1);
	}

	.count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.2rem;
		height: 1.2rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		background: #f59e0b;
		color: #fff;
		font-size: 0.68rem;
		font-weight: 700;
		line-height: 1;
	}

	.count.muted {
		background: rgba(10, 95, 99, 0.15);
		color: #0a5f63;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.status {
		margin: 0;
		font-size: 0.92rem;
		color: #3a545c;
	}

	.status.err {
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
