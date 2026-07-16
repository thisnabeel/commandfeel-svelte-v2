<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Api from '$lib/api/api';
	import { user, credsView } from '$lib/stores/user';
	import AbstractionLevelPicker from '$lib/components/AbstractionLevelPicker.svelte';
	import MyNotes from './MyNotes.svelte';
	import QuestionsPanel from '$lib/components/Questions/QuestionsPanel.svelte';
	import EvidencePanel from '$lib/components/Evidence/EvidencePanel.svelte';
	import {
		defaultSelectedLevel,
		hasAbstractionBody,
		showLevelPicker,
		visibleLevels
	} from '$lib/abstractionLevels.js';
	import { countBadgeWorthy } from '$lib/questions/badgeCounts.js';

	/** Occupation skill row id (required for My Notes) */
	export let occupationSkillId;
	/** Linked university skill id — optional */
	export let skillId = null;
	export let onNotePresence = (_id, _hasNote) => {};
	export let onEvidencePresence = (_id, _hasApproved) => {};
	export let onUnresolvedChange = (_id, _count) => {};
	/** Unresolved attention count for this skill (row badge). */
	export let unresolvedCount = 0;
	/** @type {string|null} */
	export let initialTab = null;
	/** Optional cohort context for evidence */
	export let cohortId = null;

	const dispatch = createEventDispatcher();

	let loading = true;
	let error = '';
	let abstractions = [];
	let histories = [];
	let phrases = [];
	let activeTab = 'notes';
	let selectedLevel = 0;
	let tabChosen = false;
	let evidenceApproved = false;

	function hasHistoryBody(h) {
		const body = h?.body;
		if (typeof body !== 'string') return !!body;
		return body.replace(/<[^>]*>/g, '').trim().length > 0;
	}

	function openSignIn() {
		credsView.set('signIn');
	}

	function countUnresolved(list) {
		return countBadgeWorthy(list, $user, { asAdmin: !!$user?.admin });
	}

	function onSkillQuestionsChange(list) {
		const n = countUnresolved(list);
		onUnresolvedChange(occupationSkillId, n);
	}

	function onEvidenceStatus(hasApproved) {
		evidenceApproved = !!hasApproved;
		// Row underline tracks the signed-in user's own approved evidence.
		// Learners only load their own items, so hasApproved matches.
		if (!isAdmin) {
			onEvidencePresence(occupationSkillId, !!hasApproved);
		}
	}

	$: hasQuestionBadge = unresolvedCount > 0;

	$: isSignedIn = !!$user;
	$: isAdmin = !!($user && $user.admin);
	$: hasAbstractions = abstractions.length > 0;
	$: hasHistory = histories.length > 0;
	$: hasPhrases = phrases.length > 0;
	$: hasSkillContent = hasAbstractions || hasHistory || hasPhrases;
	$: showNotesTab = !!occupationSkillId;
	$: showQuestionsTab = !!occupationSkillId;
	$: showEvidenceTab = !!occupationSkillId;
	$: canEditNotes = isSignedIn && showNotesTab;
	$: hasPanel = showNotesTab || hasSkillContent || showQuestionsTab || showEvidenceTab;
	$: pickerVisible = showLevelPicker(abstractions, isAdmin);
	$: levels = visibleLevels(abstractions, isAdmin);
	$: filteredAbstractions = abstractions.filter((a) => (a.level ?? 0) === selectedLevel);
	$: mainTabs = [
		...(showNotesTab ? [{ id: 'notes', label: 'My Notes' }] : []),
		...(hasAbstractions ? [{ id: 'abstractions', label: 'Abstractions' }] : []),
		...(hasHistory ? [{ id: 'history', label: 'History' }] : []),
		...(hasPhrases ? [{ id: 'phrases', label: 'Phrases' }] : [])
	];
	$: tabs = [
		...mainTabs,
		...(showEvidenceTab ? [{ id: 'evidence', label: 'Evidence' }] : []),
		...(showQuestionsTab ? [{ id: 'questions', label: 'Questions' }] : [])
	];
	$: showTabBar = mainTabs.length > 0 || showQuestionsTab || showEvidenceTab;

	$: if (levels.length && !levels.includes(selectedLevel)) {
		selectedLevel = levels[0];
	}

	let appliedInitialTab = null;

	$: if (
		initialTab &&
		initialTab !== appliedInitialTab &&
		tabs.some((t) => t.id === initialTab)
	) {
		activeTab = initialTab;
		tabChosen = true;
		appliedInitialTab = initialTab;
	} else if (!tabChosen && tabs.length) {
		activeTab =
			tabs.find((t) => t.id !== 'notes' && t.id !== 'questions' && t.id !== 'evidence')?.id ||
			tabs.find((t) => t.id !== 'notes')?.id ||
			tabs[0].id;
	}

	async function load() {
		loading = true;
		error = '';
		abstractions = [];
		histories = [];
		phrases = [];
		if (!initialTab) {
			tabChosen = false;
			appliedInitialTab = null;
		}

		if (occupationSkillId && isSignedIn) {
			prefetchEvidenceStatus();
		}

		if (!skillId) {
			loading = false;
			if (!showNotesTab) dispatch('empty');
			return;
		}

		try {
			const [skill, phraseList] = await Promise.all([
				Api.get(`/skills/${skillId}.json`),
				Api.get(`/skills/${skillId}/phrases`).catch(() => [])
			]);
			abstractions = (skill?.abstractions || []).filter(hasAbstractionBody);
			histories = (skill?.skill_histories || []).filter(hasHistoryBody);
			phrases = (phraseList || []).filter((p) => (p?.body || '').trim().length > 0);
			selectedLevel = defaultSelectedLevel(abstractions, isAdmin);

			if (!(abstractions.length > 0 || histories.length > 0 || phrases.length > 0) && !showNotesTab) {
				dispatch('empty');
			}
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to load skill content';
			if (!showNotesTab) dispatch('empty');
		} finally {
			loading = false;
		}
	}

	async function prefetchEvidenceStatus() {
		try {
			const list = await Api.get(
				`/occupation_skills/${occupationSkillId}/occupation_skill_evidences`
			);
			const arr = Array.isArray(list) ? list : [];
			const anyApproved = arr.some((e) => e.approved);
			const ownApproved = arr.some(
				(e) => e.approved && e.user_id != null && String(e.user_id) === String($user?.id)
			);
			evidenceApproved = anyApproved;
			onEvidencePresence(occupationSkillId, ownApproved);
		} catch {
			/* ignore */
		}
	}

	onMount(load);

	function selectTab(id) {
		tabChosen = true;
		activeTab = id;
		if ((id === 'notes' || id === 'questions' || id === 'evidence') && !isSignedIn) {
			openSignIn();
		}
	}
</script>

{#if loading}
	<div class="preview loading" transition:slide={{ duration: 200 }}>Loading…</div>
{:else if error && !showNotesTab}
	<div class="preview error" transition:slide={{ duration: 200 }}>{error}</div>
{:else if hasPanel}
	<div class="preview" transition:slide={{ duration: 220 }}>
		{#if showTabBar}
			<div class="tabs" role="tablist">
				<div class="tabs-main">
					{#each mainTabs as tab}
						<button
							type="button"
							class="tab"
							class:active={activeTab === tab.id}
							role="tab"
							aria-selected={activeTab === tab.id}
							on:click={() => selectTab(tab.id)}
						>
							{tab.label}
						</button>
					{/each}
				</div>
				<div class="tabs-end">
					{#if showEvidenceTab}
						<button
							type="button"
							class="tab icon-tab camera-tab"
							class:active={activeTab === 'evidence'}
							class:approved={evidenceApproved}
							role="tab"
							aria-selected={activeTab === 'evidence'}
							aria-label={evidenceApproved ? 'Evidence, approved' : 'Evidence'}
							title={evidenceApproved ? 'Evidence (approved)' : 'Evidence'}
							on:click={() => selectTab('evidence')}
						>
							<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
								<path
									fill="currentColor"
									d="M12 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-7h-1.2l-1.1-1.4c-.3-.4-.8-.6-1.3-.6H9.6c-.5 0-1 .2-1.3.6L7.2 5H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H6V7h1.9l1.3-1.6h5.6L16.1 7H18v10z"
								/>
							</svg>
						</button>
					{/if}
					{#if showQuestionsTab}
						<button
							type="button"
							class="tab q-tab icon-tab"
							class:active={activeTab === 'questions'}
							class:has-badge={hasQuestionBadge}
							role="tab"
							aria-selected={activeTab === 'questions'}
							aria-label={hasQuestionBadge
								? `Questions, ${unresolvedCount} unresolved`
								: 'Questions'}
							title={hasQuestionBadge
								? `${unresolvedCount} unresolved question${unresolvedCount === 1 ? '' : 's'}`
								: 'Questions'}
							on:click={() => selectTab('questions')}
						>
							<span class="q-icon" aria-hidden="true">?</span>
							{#if hasQuestionBadge}
								<span class="q-count">{unresolvedCount > 9 ? '9+' : unresolvedCount}</span>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<div class="panel">
			{#if activeTab === 'notes' && showNotesTab}
				{#if canEditNotes}
					<MyNotes {occupationSkillId} {onNotePresence} />
				{:else}
					<div class="notes-gate">
						<p>Sign in to add notes for this skill.</p>
						<button type="button" class="gate-btn" on:click={openSignIn}>Sign in</button>
					</div>
				{/if}
			{:else if activeTab === 'abstractions' && hasAbstractions}
				{#if pickerVisible}
					<AbstractionLevelPicker
						{levels}
						selected={selectedLevel}
						onSelect={(level) => (selectedLevel = level)}
					/>
				{/if}
				{#if filteredAbstractions.length > 0}
					<ul class="abstractions">
						{#each filteredAbstractions as abstraction (abstraction.id)}
							<li class="abstraction">
								{@html abstraction.body}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="empty-level">No abstractions at this level.</p>
				{/if}
			{:else if activeTab === 'history' && hasHistory}
				<div class="histories">
					{#each histories as history (history.id)}
						<article class="history-post">
							<div class="prose">
								{@html history.body}
							</div>
						</article>
					{/each}
				</div>
			{:else if activeTab === 'phrases' && hasPhrases}
				<ul class="phrases">
					{#each phrases as phrase (phrase.id)}
						<li class="phrase">
							<p class="phrase-body">{phrase.body}</p>
							{#if phrase.role}
								<span class="role">{phrase.role}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{:else if activeTab === 'evidence' && showEvidenceTab}
				{#if isSignedIn}
					<EvidencePanel
						{occupationSkillId}
						{cohortId}
						onStatusChange={onEvidenceStatus}
					/>
				{:else}
					<div class="notes-gate">
						<p>Sign in to add evidence for this skill.</p>
						<button type="button" class="gate-btn" on:click={openSignIn}>Sign in</button>
					</div>
				{/if}
			{:else if activeTab === 'questions' && showQuestionsTab}
				{#if isSignedIn}
					<QuestionsPanel
						questionableType="OccupationSkill"
						questionableId={occupationSkillId}
						emptyLabel="No questions on this skill yet."
						onChange={onSkillQuestionsChange}
					/>
				{:else}
					<div class="notes-gate">
						<p>Sign in to ask questions about this skill.</p>
						<button type="button" class="gate-btn" on:click={openSignIn}>Sign in</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	.preview {
		margin: 0.35rem 0 1rem 2.05rem;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.72);
		border: 1px solid rgba(15, 118, 110, 0.16);
		overflow: hidden;
		backdrop-filter: blur(6px);
	}

	.preview.loading,
	.preview.error {
		padding: 0.85rem 1rem;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.9rem;
		color: #64748b;
	}

	.preview.error {
		color: #b91c1c;
	}

	.tabs {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		gap: 0.5rem;
		padding: 0.65rem 0.9rem 0;
		background: rgba(15, 118, 110, 0.04);
	}

	.tabs-main {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		flex: 1 1 auto;
		min-width: 0;
	}

	.tabs-end {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex: 0 0 auto;
		margin-left: auto;
	}

	.tab {
		border: none;
		background: transparent;
		color: #64748b;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.tab.active {
		background: #0f172a;
		color: #fff;
	}

	.icon-tab {
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.45rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		border-radius: 999px;
		border: 1.5px solid rgba(15, 118, 110, 0.35);
		background: #fff;
		color: #0f766e;
	}

	.icon-tab:hover {
		border-color: #0f766e;
		background: rgba(15, 118, 110, 0.08);
	}

	.camera-tab.approved {
		background: #059669;
		border-color: #047857;
		color: #fff;
	}

	.camera-tab.approved:hover {
		background: #047857;
		border-color: #065f46;
		color: #fff;
	}

	.camera-tab.active {
		background: #0f172a;
		border-color: #0f172a;
		color: #fff;
	}

	.camera-tab.approved.active {
		background: #047857;
		border-color: #065f46;
		color: #fff;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.28);
	}

	.q-tab {
		margin-left: 0;
	}

	.q-tab.has-badge {
		padding: 0 0.5rem 0 0.4rem;
		background: #f59e0b;
		border-color: #d97706;
		color: #fff;
	}

	.q-tab.has-badge:hover {
		background: #d97706;
		border-color: #b45309;
		color: #fff;
	}

	.q-tab.active {
		background: #0f172a;
		border-color: #0f172a;
		color: #fff;
	}

	.q-tab.has-badge.active {
		background: #d97706;
		border-color: #b45309;
		color: #fff;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.28);
	}

	.q-icon {
		font-family: 'Space Grotesk', system-ui, sans-serif;
		font-size: 0.95rem;
		font-weight: 700;
		line-height: 1;
	}

	.q-count {
		font-family: 'Space Grotesk', system-ui, sans-serif;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1;
	}

	.panel {
		padding: 0.85rem 0.9rem 1rem;
	}

	.notes-gate {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.35rem 0.15rem 0.5rem;
	}

	.notes-gate p {
		margin: 0;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.95rem;
		line-height: 1.5;
		color: #475569;
	}

	.gate-btn {
		border: none;
		border-radius: 8px;
		background: #0f172a;
		color: #fff;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.55rem 0.95rem;
		cursor: pointer;
	}

	.gate-btn:hover {
		background: #1e293b;
	}

	.abstractions,
	.phrases,
	.histories {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.abstraction {
		margin: 0;
		padding: 1rem 1.1rem;
		border-radius: 10px;
		background: #ffd67f;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.98rem;
		line-height: 1.55;
		color: #1e293b;
	}

	.abstraction :global(p) {
		margin: 0 0 0.5rem;
	}

	.abstraction :global(p:last-child) {
		margin-bottom: 0;
	}

	.empty-level {
		margin: 0;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.9rem;
		color: #64748b;
	}

	.history-post {
		margin: 0;
		padding: 1rem 1.1rem;
		border-radius: 10px;
		background: #faf8f5;
		border: 1px solid rgba(15, 118, 110, 0.12);
	}

	.prose {
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', Georgia, 'Times New Roman', serif;
		font-size: 0.95rem;
		line-height: 1.65;
		color: #1e293b;
	}

	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3) {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		line-height: 1.3;
		margin: 0 0 0.65rem;
		color: #0f172a;
	}

	.prose :global(h1) {
		font-size: 1.25rem;
	}

	.prose :global(h2) {
		font-size: 1.1rem;
	}

	.prose :global(h3) {
		font-size: 1rem;
		margin-top: 0.85rem;
	}

	.prose :global(p) {
		margin: 0 0 0.75rem;
	}

	.prose :global(p:last-child) {
		margin-bottom: 0;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin: 0 0 0.75rem;
		padding-left: 1.25rem;
	}

	.prose :global(blockquote) {
		margin: 0.75rem 0;
		padding-left: 0.85rem;
		border-left: 3px solid #0f766e;
		color: #475569;
		font-style: italic;
	}

	.phrase {
		padding: 0.85rem 1rem;
		border-radius: 10px;
		background: rgba(15, 118, 110, 0.06);
		border: 1px solid rgba(15, 118, 110, 0.1);
	}

	.phrase-body {
		margin: 0;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.95rem;
		line-height: 1.55;
		color: #334155;
	}

	.role {
		display: inline-block;
		margin-top: 0.45rem;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #0f766e;
	}
</style>
