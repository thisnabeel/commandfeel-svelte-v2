<script>
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api';
	import View from '$lib/components/Occupations/View/View.svelte';
	import QuestionsPanel from '$lib/components/Questions/QuestionsPanel.svelte';
	import PendingEvidencesPanel from '$lib/components/Evidence/PendingEvidencesPanel.svelte';
	import ResumeBulletsPanel from '$lib/components/Evidence/ResumeBulletsPanel.svelte';
	import InterestingJobsPanel from '$lib/components/Jobs/InterestingJobsPanel.svelte';
	import JoinOpenSeats from '$lib/components/Landing/JoinOpenSeats.svelte';
	import { countBadgeWorthy } from '$lib/questions/badgeCounts.js';

	export let memberships = [];
	export let adminPreview = false;
	/** Notify parent after joining so /mine can reload */
	export let onJoined = (_seat) => {};

	let panelTab = 'vocabulary';
	let vocabLoadedFor = null;
	let occupation = null;
	let tree = [];
	let notedIds = new Set();
	/** @type {Set<number|string>} */
	let approvedEvidenceIds = new Set();
	/** @type {Record<string, number>} */
	let unresolvedBySkillId = {};
	let vocabLoading = false;
	let vocabError = '';
	let unresolvedQuestionCount = 0;
	let questionsLoadedFor = null;
	let pendingEvidenceCount = 0;
	let pendingEvidenceLoadedFor = null;
	/** @type {any[]} */
	let cohortMembers = [];
	/** @type {number|string|null} */
	let cohortMembersLoadedFor = null;
	let cohortMembersLoading = false;
	/** Admin teacher view: selected learner seat (null = own/admin dashboard) */
	/** @type {any|null} */
	let viewingAsSeat = null;
	let projectInfoOpen = false;
	let projectDescriptionEditing = false;
	let projectDescriptionDraft = '';
	let projectDescriptionSaving = false;
	let projectDescriptionError = '';
	/** @type {number|string|null} */
	let projectDescriptionSyncedFor = null;

	const panelTabs = [
		{ id: 'vocabulary', label: 'Vocabulary' },
		{ id: 'questions', label: 'My Questions' },
		{ id: 'resume', label: 'Resume Bullets' },
		{ id: 'jobs', label: 'Interesting Jobs' }
	];

	$: isAdmin = !!(adminPreview || $user?.admin);
	$: isTeacherViewing = !!(isAdmin && viewingAsSeat);
	$: isAdminView = isAdmin && !isTeacherViewing;
	$: showMembers =
		!!primary?.cohort_id &&
		(isAdmin || primary?.status === 'assigned' || primary?.status === 'applied');
	$: panelTabsResolved = [
		...panelTabs.map((tab) =>
			tab.id === 'questions' && isAdminView
				? { ...tab, label: 'Unresolved Questions' }
				: tab
		),
		...(isAdminView ? [{ id: 'pending_evidence', label: 'Pending Evidences' }] : [])
	];

	function countUnresolved(list) {
		return countBadgeWorthy(list, $user, { asAdmin: false });
	}

	function onQuestionsChange(list) {
		unresolvedQuestionCount = isAdminView
			? (list || []).length
			: countUnresolved(list);
		if (primary?.id) questionsLoadedFor = questionsLoadKey(primary);
	}

	function onPendingEvidenceChange(list) {
		pendingEvidenceCount = (list || []).length;
		if (primary?.cohort_id) pendingEvidenceLoadedFor = primary.cohort_id;
	}

	function questionsLoadKey(seat) {
		if (!seat) return null;
		return isAdminView ? `cohort:${seat.cohort_id}` : `mine:${seat.id}`;
	}

	async function loadUnresolvedCount(seat) {
		if (!$user || !seat) {
			unresolvedQuestionCount = 0;
			questionsLoadedFor = null;
			return;
		}
		const key = questionsLoadKey(seat);
		if (questionsLoadedFor === key) return;
		try {
			if (isAdminView && seat.cohort_id) {
				const list = await Api.get(
					`/questions/cohort_unresolved?cohort_id=${seat.cohort_id}`
				);
				unresolvedQuestionCount = Array.isArray(list) ? list.length : 0;
			} else {
				const list = await Api.get(`/questions/mine?cohort_user_id=${seat.id}`);
				unresolvedQuestionCount = countUnresolved(list);
			}
			questionsLoadedFor = key;
		} catch {
			/* keep prior count */
		}
	}

	async function loadPendingEvidenceCount(cohortId) {
		if (!$user?.admin || !cohortId || !isAdmin) {
			pendingEvidenceCount = 0;
			pendingEvidenceLoadedFor = null;
			return;
		}
		if (pendingEvidenceLoadedFor === cohortId) return;
		try {
			const list = await Api.get(
				`/occupation_skill_evidences/pending?cohort_id=${cohortId}`
			);
			pendingEvidenceCount = Array.isArray(list) ? list.length : 0;
			pendingEvidenceLoadedFor = cohortId;
		} catch {
			/* keep prior */
		}
	}

	async function loadCohortMembers(cohortId) {
		if (!$user || !cohortId || !showMembers) {
			cohortMembers = [];
			cohortMembersLoadedFor = null;
			cohortMembersLoading = false;
			return;
		}
		if (cohortMembersLoadedFor === cohortId) return;
		try {
			cohortMembersLoading = true;
			const list = await Api.get(`/cohort_users?cohort_id=${cohortId}`);
			const seats = Array.isArray(list) ? list : [];
			cohortMembers = seats
				.filter((s) => {
					if (!s.user_id) return false;
					if (!(s.status === 'assigned' || s.status === 'applied')) return false;
					// Admin view-as list hides self; learner roster shows the full team.
					if (isAdmin && String(s.user_id) === String($user?.id)) return false;
					return true;
				})
				.sort((a, b) => {
					const ao = a.status === 'assigned' ? 0 : 1;
					const bo = b.status === 'assigned' ? 0 : 1;
					if (ao !== bo) return ao - bo;
					return String(memberLabel(a)).localeCompare(String(memberLabel(b)));
				});
			cohortMembersLoadedFor = cohortId;
		} catch {
			cohortMembers = [];
			cohortMembersLoadedFor = null;
		} finally {
			cohortMembersLoading = false;
		}
	}

	function memberLabel(seat) {
		const username = (seat?.user_username || '').trim();
		if (username) return username;
		const email = (seat?.user_email || '').trim();
		if (email) return email.split('@')[0] || email;
		return 'Member';
	}

	function clearViewCaches() {
		vocabLoadedFor = null;
		questionsLoadedFor = null;
		occupation = null;
		tree = [];
		notedIds = new Set();
		approvedEvidenceIds = new Set();
		unresolvedBySkillId = {};
		unresolvedQuestionCount = 0;
	}

	function viewAsMember(seat) {
		if (!isAdmin || !seat?.id) return;
		if (viewingAsSeat && String(viewingAsSeat.id) === String(seat.id)) {
			exitViewAs();
			return;
		}
		viewingAsSeat = seat;
		clearViewCaches();
		if (panelTab === 'pending_evidence') panelTab = 'vocabulary';
		if (seat.occupation_id) loadVocabulary(seat.occupation_id);
		loadUnresolvedCount(seat);
	}

	function exitViewAs() {
		viewingAsSeat = null;
		clearViewCaches();
		const seat = memberships[0];
		if (seat?.occupation_id) loadVocabulary(seat.occupation_id);
		if (seat) loadUnresolvedCount(seat);
	}

	function syncProjectDescription(seat) {
		const key = seat?.cohort_id != null ? String(seat.cohort_id) : null;
		if (!key || projectDescriptionSyncedFor === key) return;
		projectDescriptionDraft = seat?.cohort_description || '';
		projectDescriptionError = '';
		projectDescriptionEditing = false;
		projectDescriptionSyncedFor = key;
	}

	function startEditProjectDescription() {
		if (!canEditProjectDescription) return;
		projectDescriptionDraft = primary?.cohort_description || projectDescriptionDraft || '';
		projectDescriptionEditing = true;
		projectDescriptionError = '';
	}

	function cancelEditProjectDescription() {
		projectDescriptionDraft = primary?.cohort_description || '';
		projectDescriptionEditing = false;
		projectDescriptionError = '';
	}

	function applyLocalCohortDescription(cohortId, text) {
		memberships = (memberships || []).map((m) =>
			String(m.cohort_id) === String(cohortId) ? { ...m, cohort_description: text } : m
		);
		if (viewingAsSeat && String(viewingAsSeat.cohort_id) === String(cohortId)) {
			viewingAsSeat = { ...viewingAsSeat, cohort_description: text };
		}
		cohortMembers = (cohortMembers || []).map((m) =>
			String(m.cohort_id) === String(cohortId) ? { ...m, cohort_description: text } : m
		);
	}

	$: canEditProjectDescription =
		!!$user &&
		!!primary?.cohort_id &&
		(!!$user.admin || primary.status === 'assigned' || adminPreview);

	async function saveProjectDescription() {
		if (!primary?.cohort_id || !canEditProjectDescription || projectDescriptionSaving) return;
		try {
			projectDescriptionSaving = true;
			projectDescriptionError = '';
			const updated = await Api.patch(`/cohorts/${primary.cohort_id}/update_description`, {
				cohort: { description: projectDescriptionDraft }
			});
			const text = updated?.description ?? projectDescriptionDraft;
			projectDescriptionDraft = text;
			applyLocalCohortDescription(primary.cohort_id, text);
			projectDescriptionEditing = false;
		} catch (err) {
			projectDescriptionError =
				err?.response?.data?.error ||
				err?.response?.data?.errors?.join?.(', ') ||
				err?.message ||
				'Could not save description.';
		} finally {
			projectDescriptionSaving = false;
		}
	}

	function firstName(u) {
		if (!u) return 'there';
		if ((u.first_name || '').trim()) return u.first_name.trim();
		const fromUsername = (u.username || '').trim().split(/[\s._-]+/)[0];
		if (fromUsername) {
			return fromUsername.charAt(0).toUpperCase() + fromUsername.slice(1);
		}
		const local = (u.email || '').split('@')[0] || '';
		const token = local.split(/[\s._-]+/)[0];
		if (token) return token.charAt(0).toUpperCase() + token.slice(1);
		return 'there';
	}

	function parseDate(value) {
		if (!value) return null;
		const d = new Date(`${value}T12:00:00`);
		return Number.isNaN(d.getTime()) ? null : d;
	}

	function monthDay(d) {
		return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
	}

	function fullDate(d) {
		return d.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDateRange(start, end) {
		const a = parseDate(start);
		const b = parseDate(end);
		if (a && b) {
			if (a.getFullYear() === b.getFullYear()) {
				return {
					kind: 'sameYear',
					months: `${monthDay(a)} – ${monthDay(b)}`,
					year: String(a.getFullYear())
				};
			}
			return { kind: 'crossYear', text: `${fullDate(a)} – ${fullDate(b)}` };
		}
		if (a) return { kind: 'single', text: fullDate(a) };
		if (b) return { kind: 'single', text: fullDate(b) };
		return { kind: 'empty', text: '—' };
	}

	function buildTree(flat) {
		const byId = {};
		const roots = [];
		for (const item of flat || []) {
			byId[item.id] = { ...item, skills: [] };
		}
		for (const item of flat || []) {
			const node = byId[item.id];
			if (item.occupation_skill_id && byId[item.occupation_skill_id]) {
				byId[item.occupation_skill_id].skills.push(node);
			} else {
				roots.push(node);
			}
		}
		const sortRecursive = (nodes) => {
			nodes.sort((a, b) => (a.position || 0) - (b.position || 0));
			nodes.forEach((n) => sortRecursive(n.skills));
		};
		sortRecursive(roots);
		return roots;
	}

	function onNotePresence(id, hasNote) {
		const next = new Set(notedIds);
		if (hasNote) next.add(id);
		else next.delete(id);
		notedIds = next;
	}

	function onEvidencePresence(id, hasApproved) {
		if (!id) return;
		const next = new Set(approvedEvidenceIds);
		if (hasApproved) {
			next.add(id);
			next.add(String(id));
		} else {
			next.delete(id);
			next.delete(String(id));
		}
		approvedEvidenceIds = next;
	}

	function onUnresolvedChange(skillId, count) {
		if (!skillId) return;
		const next = { ...unresolvedBySkillId };
		const key = String(skillId);
		if (count > 0) next[key] = count;
		else delete next[key];
		unresolvedBySkillId = next;
		if (primary?.id) {
			questionsLoadedFor = null;
			loadUnresolvedCount(primary);
		}
	}

	async function loadUnresolvedBySkill(occupationId) {
		if (!$user || !occupationId) {
			unresolvedBySkillId = {};
			return;
		}
		try {
			const counts = await Api.get(`/occupations/${occupationId}/unresolved_question_counts`);
			unresolvedBySkillId =
				counts && typeof counts === 'object' && !Array.isArray(counts) ? counts : {};
		} catch {
			unresolvedBySkillId = {};
		}
	}

	async function loadVocabulary(occupationId) {
		if (!occupationId) return;
		const subjectKey = viewingAsSeat?.user_id ? String(viewingAsSeat.user_id) : 'self';
		const cacheKey = `${occupationId}:${subjectKey}`;
		if (vocabLoadedFor === cacheKey && occupation) return;
		try {
			vocabLoading = true;
			vocabError = '';
			const occ = await Api.get(`/occupations/${occupationId}`);
			occupation = occ;
			tree = buildTree(occ.occupation_skills || []);
			if ($user) {
				const userQ =
					viewingAsSeat?.user_id != null ? `?user_id=${viewingAsSeat.user_id}` : '';
				try {
					const ids = await Api.get(`/occupations/${occupationId}/my_notes${userQ}`);
					notedIds = new Set(Array.isArray(ids) ? ids : []);
				} catch {
					notedIds = new Set();
				}
				try {
					const evIds = await Api.get(
						`/occupations/${occupationId}/my_approved_evidences${userQ}`
					);
					approvedEvidenceIds = new Set(Array.isArray(evIds) ? evIds : []);
				} catch {
					approvedEvidenceIds = new Set();
				}
				await loadUnresolvedBySkill(occupationId);
			} else {
				notedIds = new Set();
				approvedEvidenceIds = new Set();
				unresolvedBySkillId = {};
			}
			vocabLoadedFor = cacheKey;
		} catch (err) {
			vocabError = err?.response?.data?.error || err?.message || 'Failed to load vocabulary';
			occupation = null;
			tree = [];
		} finally {
			vocabLoading = false;
		}
	}

	async function selectPanelTab(id) {
		panelTab = id;
		if (id === 'vocabulary' && primary?.occupation_id) {
			await loadVocabulary(primary.occupation_id);
		}
	}

	$: primary = viewingAsSeat || memberships[0];
	$: if (primary) syncProjectDescription(primary);
	$: greetingName = firstName($user);
	$: dateDisplay = primary
		? formatDateRange(primary.cohort_start_date, primary.cohort_end_date)
		: null;
	$: sprintNodes = (primary?.cohort_sprints || []).map((s, i) => ({
		id: s.id,
		n: String(s.position ?? i + 1).padStart(2, '0'),
		label: `Sprint ${s.position ?? i + 1}`,
		active: !!s.active,
		goal: s.goal || ''
	}));
	$: activeSprint = sprintNodes.find((s) => s.active) || sprintNodes[0];
	$: if (primary?.occupation_id && panelTab === 'vocabulary') {
		loadVocabulary(primary.occupation_id);
	}
	$: if (primary?.id) {
		loadUnresolvedCount(primary);
	} else {
		unresolvedQuestionCount = 0;
	}
	$: if (isAdmin && primary?.cohort_id) {
		loadPendingEvidenceCount(primary.cohort_id);
	} else if (!isAdmin) {
		pendingEvidenceCount = 0;
	}

	$: if (showMembers && primary?.cohort_id) {
		loadCohortMembers(primary.cohort_id);
	} else {
		cohortMembers = [];
		cohortMembersLoadedFor = null;
	}

	$: if (!isAdmin && viewingAsSeat) {
		viewingAsSeat = null;
	}
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section class="dashboard" class:student-view={isTeacherViewing}>
	<div class="wrap">
		<h1>
			Hi
			{#if $user?.admin}
				<span class="admin-name">{greetingName}</span>
				<span class="admin-badge" title="Admin">
					<svg class="crown" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
						<path
							fill="currentColor"
							d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"
						/>
					</svg>
					admin
				</span>
			{:else}
				{greetingName}
			{/if}
		</h1>

		{#if primary}
			<article class="seat-card">
				<div class="seat-top">
					<div class="seat-copy">
						<p class="seat-kicker">
							{#if isTeacherViewing}
								Viewing as {memberLabel(viewingAsSeat)}
							{:else if adminPreview}
								Admin view of
							{:else if primary.status === 'assigned'}
								You're enrolled in
							{:else}
								Application pending for
							{/if}
						</p>
						<div class="cohort-title-row">
							<h2 class="cohort-name">{primary.cohort_title || 'Your cohort'}</h2>
							<button
								type="button"
								class="project-info-btn"
								class:open={projectInfoOpen}
								aria-expanded={projectInfoOpen}
								aria-controls="project-description"
								title={projectInfoOpen ? 'Hide project info' : 'Project info'}
								on:click={() => {
									projectInfoOpen = !projectInfoOpen;
									if (!projectInfoOpen) {
										projectDescriptionEditing = false;
										projectDescriptionError = '';
										projectDescriptionDraft = primary?.cohort_description || '';
									}
								}}
							>
								i
							</button>
						</div>
						{#if primary.cohort_subtitle}
							<p class="cohort-sub">{primary.cohort_subtitle}</p>
						{/if}
					</div>
					{#if primary.occupation_title}
						<div class="role-chip">
							<span class="role-label">Occupation</span>
							<span class="role-title">{primary.occupation_title}</span>
						</div>
					{/if}
				</div>

				{#if projectInfoOpen}
					<div class="project-info" id="project-description">
						<div class="project-info-head">
							<span class="stat-label">Project description</span>
							{#if canEditProjectDescription && !projectDescriptionEditing}
								<button
									type="button"
									class="project-edit-btn"
									title="Edit description"
									aria-label="Edit project description"
									on:click={startEditProjectDescription}
								>
									<i class="fa fa-pencil" aria-hidden="true" />
								</button>
							{/if}
						</div>
						{#if canEditProjectDescription && projectDescriptionEditing}
							<textarea
								class="project-desc-input"
								rows="4"
								placeholder="Add a shared description of this project…"
								bind:value={projectDescriptionDraft}
								disabled={projectDescriptionSaving}
							/>
							{#if projectDescriptionError}
								<p class="project-desc-err">{projectDescriptionError}</p>
							{/if}
							<div class="project-desc-actions">
								<button
									type="button"
									class="project-desc-save"
									disabled={projectDescriptionSaving}
									on:click={saveProjectDescription}
								>
									{projectDescriptionSaving ? 'Saving…' : 'Save description'}
								</button>
								<button
									type="button"
									class="project-desc-cancel"
									disabled={projectDescriptionSaving}
									on:click={cancelEditProjectDescription}
								>
									Cancel
								</button>
							</div>
						{:else if (projectDescriptionDraft || primary?.cohort_description || '').trim()}
							<p class="project-desc-body">
								{projectDescriptionDraft || primary?.cohort_description}
							</p>
						{:else}
							<p class="project-desc-empty">
								No project description yet.{#if canEditProjectDescription}
									{' '}Use the pen to add one.
								{/if}
							</p>
						{/if}
					</div>
				{/if}

				{#if dateDisplay?.kind !== 'empty' || primary.status === 'applied' || (showMembers && (cohortMembers.length > 0 || cohortMembersLoading))}
					<div class="seat-foot" class:seat-foot-members={showMembers}>
						{#if dateDisplay && dateDisplay.kind !== 'empty'}
							<div class="stat dates-stat">
								<span class="stat-label">Dates</span>
								{#if dateDisplay.kind === 'sameYear'}
									<span class="stat-value date-months">{dateDisplay.months}</span>
									<span class="date-year">{dateDisplay.year}</span>
								{:else}
									<span class="stat-value">{dateDisplay.text}</span>
								{/if}
							</div>
						{/if}
						{#if primary.status === 'applied' && !isTeacherViewing}
							<div class="stat">
								<span class="stat-label">Status</span>
								<span class="status status-applied">Pending</span>
							</div>
						{/if}
						{#if showMembers}
							<div class="members-block">
								<div class="members-head">
									<span class="stat-label">Members</span>
									{#if isTeacherViewing}
										<button type="button" class="exit-view" on:click={exitViewAs}>
											Exit student view
										</button>
									{/if}
								</div>
								{#if cohortMembersLoading && !cohortMembers.length}
									<p class="members-empty">Loading…</p>
								{:else if !cohortMembers.length}
									<p class="members-empty">No enrolled members yet</p>
								{:else}
									<div class="members-scroll" role="list" aria-label="Cohort members">
										{#each cohortMembers as seat (seat.id)}
											{#if isAdmin}
												<button
													type="button"
													class="member-chip"
													role="listitem"
													class:pending={seat.status === 'applied'}
													class:selected={viewingAsSeat &&
														String(viewingAsSeat.id) === String(seat.id)}
													aria-pressed={viewingAsSeat &&
														String(viewingAsSeat.id) === String(seat.id)}
													title="View cohort as {memberLabel(seat)}"
													on:click={() => viewAsMember(seat)}
												>
													<span class="member-name">{memberLabel(seat)}</span>
													{#if seat.occupation_title}
														<span class="member-role">{seat.occupation_title}</span>
													{/if}
													{#if seat.status === 'applied'}
														<span class="member-status">Pending</span>
													{/if}
												</button>
											{:else}
												<div
													class="member-chip"
													role="listitem"
													class:pending={seat.status === 'applied'}
													class:is-you={String(seat.user_id) === String($user?.id)}
												>
													<span class="member-name">
														{memberLabel(seat)}{#if String(seat.user_id) === String($user?.id)}
															<span class="member-you">you</span>
														{/if}
													</span>
													{#if seat.occupation_title}
														<span class="member-role">{seat.occupation_title}</span>
													{/if}
													{#if seat.status === 'applied'}
														<span class="member-status">Pending</span>
													{/if}
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				{#if sprintNodes.length}
					<div class="sprint-band" aria-label="{sprintNodes.length} sprints">
						<p class="sprint-kicker">Sprints</p>
						<div class="track">
							{#each sprintNodes as sprint, i}
								<div class="node" class:is-active={sprint.active}>
									<span class="node-n">{sprint.n}</span>
									<span class="node-label">{sprint.label}</span>
								</div>
								{#if i < sprintNodes.length - 1}
									<div class="connector" aria-hidden="true" />
								{/if}
							{/each}
						</div>
						{#if activeSprint?.goal}
							<p class="active-goal">
								<span>Current goal</span>
								{activeSprint.goal}
							</p>
						{/if}
					</div>
				{/if}
			</article>

			{#if primary.occupation_id}
				<section class="work-panel">
					<div class="panel-tabs" role="tablist" aria-label="Occupation workspace">
						{#each panelTabsResolved as tab}
							<button
								type="button"
								class="panel-tab"
								class:active={panelTab === tab.id}
								role="tab"
								aria-selected={panelTab === tab.id}
								on:click={() => selectPanelTab(tab.id)}
							>
								<span class="panel-tab-label">{tab.label}</span>
								{#if tab.id === 'questions' && unresolvedQuestionCount > 0}
									<span
										class="tab-count"
										aria-label="{unresolvedQuestionCount} unresolved"
									>
										{unresolvedQuestionCount > 99 ? '99+' : unresolvedQuestionCount}
									</span>
								{/if}
								{#if tab.id === 'pending_evidence' && pendingEvidenceCount > 0}
									<span
										class="tab-count"
										aria-label="{pendingEvidenceCount} pending evidence"
									>
										{pendingEvidenceCount > 99 ? '99+' : pendingEvidenceCount}
									</span>
								{/if}
							</button>
						{/each}
					</div>

					<div class="panel-body">
						{#if panelTab === 'vocabulary'}
							{#if vocabLoading}
								<p class="panel-status">Loading vocabulary…</p>
							{:else if vocabError}
								<p class="panel-status error">{vocabError}</p>
							{:else if occupation}
								<View
									{occupation}
									{tree}
									{notedIds}
									{onNotePresence}
									{approvedEvidenceIds}
									{onEvidencePresence}
									{unresolvedBySkillId}
									{onUnresolvedChange}
									cohortId={primary?.cohort_id || null}
									showHeader={false}
								/>
							{/if}
						{:else if panelTab === 'questions'}
							{#if isAdminView && primary?.cohort_id}
								<QuestionsPanel
									unresolvedOnly={true}
									cohortId={primary.cohort_id}
									allowAsk={false}
									emptyLabel="No unresolved questions from cohort members."
									onChange={onQuestionsChange}
								/>
							{:else if primary?.id}
								<QuestionsPanel
									questionableType="CohortUser"
									questionableId={primary.id}
									cohortUserId={primary.id}
									allowAsk={!isTeacherViewing}
									emptyLabel={isTeacherViewing
										? 'This student has not asked any questions yet.'
										: "You haven't asked any questions yet."}
									onChange={onQuestionsChange}
								/>
							{:else}
								<p class="panel-empty">Join a cohort seat to ask questions.</p>
							{/if}
						{:else if panelTab === 'pending_evidence'}
							{#if primary?.cohort_id}
								<PendingEvidencesPanel
									cohortId={primary.cohort_id}
									onChange={onPendingEvidenceChange}
								/>
							{:else}
								<p class="panel-empty">No cohort selected.</p>
							{/if}
						{:else if panelTab === 'resume'}
							{#if primary?.occupation_id}
								<ResumeBulletsPanel
									occupationId={primary.occupation_id}
									cohortId={primary.cohort_id || null}
									userId={isTeacherViewing ? primary.user_id : null}
									readOnly={isTeacherViewing}
									occupationTitle={primary.occupation_title || ''}
									cohortTitle={primary.cohort_title || ''}
									cohortSubtitle={primary.cohort_subtitle || ''}
									cohortDescription={primary.cohort_description || ''}
									onEvidenceDeleted={(_id, _skillId) => {
										if (!primary?.occupation_id || isTeacherViewing) return;
										Api.get(
											`/occupations/${primary.occupation_id}/my_approved_evidences`
										)
											.then((evIds) => {
												approvedEvidenceIds = new Set(
													Array.isArray(evIds) ? evIds : []
												);
											})
											.catch(() => {});
									}}
								/>
							{:else}
								<p class="panel-empty">
									Assign an occupation to your seat to generate resume bullets from approved
									evidence.
								</p>
							{/if}
						{:else if panelTab === 'jobs'}
							{#if primary?.id}
								<InterestingJobsPanel
									cohortUserId={primary.id}
									readOnly={isTeacherViewing}
								/>
							{:else}
								<p class="panel-empty">No cohort seat selected.</p>
							{/if}
						{/if}
					</div>
				</section>
			{/if}
		{:else}
			<JoinOpenSeats {onJoined} />
		{/if}

		{#if memberships.length > 1}
			<ul class="others">
				{#each memberships.slice(1) as m (m.id)}
					<li class="other-card">
						<div>
							<span class="other-title">{m.cohort_title}</span>
							{#if m.occupation_title}
								<span class="other-role">{m.occupation_title}</span>
							{/if}
						</div>
						<span class="status status-{m.status}">{m.status}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.dashboard {
		--ink: #071416;
		--muted: #243940;
		--soft: #3a545c;
		--accent: #0a5f63;
		--accent-deep: #074144;
		--paper: #eef4f3;
		--sand: #d9e8e6;
		width: 100vw;
		max-width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		min-height: min(70vh, 640px);
		background:
			radial-gradient(ellipse 80% 60% at 10% 0%, rgba(10, 95, 99, 0.12), transparent 55%),
			linear-gradient(165deg, #f7fbfa 0%, var(--paper) 45%, var(--sand) 100%);
		padding: 4rem 1.5rem 5rem;
		color: var(--ink);
		transition: background 0.45s ease;
	}

	.dashboard.student-view {
		--paper: #f7efe6;
		--sand: #f0e0d0;
		background:
			radial-gradient(ellipse 90% 70% at 88% -10%, rgba(232, 145, 72, 0.18), transparent 52%),
			radial-gradient(ellipse 70% 55% at 8% 100%, rgba(196, 110, 48, 0.1), transparent 50%),
			linear-gradient(165deg, #fbf6f0 0%, #f5ebe0 42%, #edd9c6 100%);
	}

	.wrap {
		width: min(720px, 100%);
		margin: 0 auto;
	}

	.work-panel {
		margin-top: 1.15rem;
		background: #fbfffe;
		border: 1px solid rgba(7, 65, 68, 0.12);
		border-radius: 18px;
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.8) inset,
			0 18px 40px -24px rgba(7, 65, 68, 0.28);
		overflow: hidden;
	}

	.panel-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding: 0.75rem 0.85rem 0;
		border-bottom: 1px solid rgba(7, 65, 68, 0.1);
		background: rgba(247, 251, 250, 0.9);
	}

	.panel-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: none;
		background: transparent;
		padding: 0.7rem 0.95rem;
		margin-bottom: -1px;
		border-bottom: 2px solid transparent;
		border-radius: 8px 8px 0 0;
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--soft);
		cursor: pointer;
	}

	.panel-tab:hover {
		color: var(--ink);
		background: rgba(10, 95, 99, 0.05);
	}

	.panel-tab.active {
		color: var(--accent-deep);
		border-bottom-color: var(--accent);
		background: #fbfffe;
	}

	.panel-tab-label {
		line-height: 1;
	}

	.tab-count {
		display: inline-grid;
		place-items: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.35rem;
		border-radius: 999px;
		background: #f59e0b;
		color: #fff;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1;
	}

	.panel-tab.active .tab-count {
		background: #d97706;
	}

	.panel-body {
		padding: 1rem 1.15rem 1.25rem;
		background: #fbfffe;
		min-height: 8rem;
	}

	.panel-status {
		margin: 0;
		padding: 1.25rem 0.25rem;
		color: var(--muted);
		font-size: 0.98rem;
	}

	.panel-status.error {
		color: #b02a37;
	}

	.panel-empty {
		margin: 0;
		padding: 2rem 0.5rem;
		text-align: center;
		color: var(--soft);
		font-family: GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 1rem;
	}

	h1 {
		margin: 0 0 1.75rem;
		font-family: Fraunces, Georgia, serif;
		font-size: clamp(2.4rem, 5vw, 3.5rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.1;
		color: var(--ink);
		text-align: left;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.35rem 0.55rem;
	}

	.admin-name {
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 0.12em;
		text-decoration-thickness: 0.06em;
	}

	.admin-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		padding: 0.2rem 0.55rem 0.2rem 0.4rem;
		border-radius: 999px;
		background: rgba(10, 95, 99, 0.1);
		color: #0a5f63;
		font-family: GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		vertical-align: middle;
		align-self: center;
	}

	.admin-badge .crown {
		flex-shrink: 0;
		color: #b45309;
	}

	.lede {
		margin: 0;
		font-family: GreyCliffCF-Regular, Georgia, serif;
		font-size: 1.15rem;
		line-height: 1.55;
		color: var(--muted);
	}

	.seat-card {
		position: relative;
		overflow: hidden;
		background: #fbfffe;
		border: 1px solid rgba(7, 65, 68, 0.12);
		border-radius: 18px;
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.8) inset,
			0 18px 40px -24px rgba(7, 65, 68, 0.35);
	}

	.seat-card::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 4px;
		background: linear-gradient(180deg, #0a5f63 0%, #0f8f94 100%);
	}

	.seat-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1.5rem;
		padding: 1.65rem 1.75rem 1.35rem 1.9rem;
	}

	.seat-kicker {
		margin: 0 0 0.45rem;
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.cohort-title-row {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		min-width: 0;
	}

	.cohort-name {
		margin: 0;
		font-family: Fraunces, Georgia, serif;
		font-size: clamp(1.55rem, 3vw, 2rem);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.15;
		color: var(--ink);
		text-align: left;
	}

	.project-info-btn {
		flex-shrink: 0;
		width: 1.55rem;
		height: 1.55rem;
		border-radius: 999px;
		border: 1.5px solid rgba(10, 95, 99, 0.35);
		background: transparent;
		color: var(--accent-deep);
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.78rem;
		font-weight: 700;
		font-style: italic;
		line-height: 1;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.project-info-btn:hover,
	.project-info-btn.open {
		background: rgba(10, 95, 99, 0.1);
		border-color: var(--accent);
		color: var(--accent);
	}

	.project-info {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		padding: 0 1.75rem 1.2rem 1.9rem;
		border-top: 1px solid rgba(7, 65, 68, 0.08);
		background: rgba(10, 95, 99, 0.03);
	}

	.project-info-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding-top: 0.85rem;
	}

	.project-edit-btn {
		width: 1.7rem;
		height: 1.7rem;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: #0a5f63;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.project-edit-btn:hover {
		background: rgba(10, 95, 99, 0.1);
	}

	.project-desc-input {
		width: 100%;
		box-sizing: border-box;
		margin-top: 0.15rem;
		padding: 0.7rem 0.8rem;
		border: 1px solid rgba(7, 65, 68, 0.18);
		border-radius: 10px;
		font: inherit;
		font-size: 0.92rem;
		line-height: 1.45;
		resize: vertical;
		min-height: 5rem;
		background: #fff;
		color: var(--ink);
	}

	.project-desc-input:focus {
		outline: none;
		border-color: rgba(10, 95, 99, 0.45);
		box-shadow: 0 0 0 3px rgba(10, 95, 99, 0.1);
	}

	.project-desc-body {
		margin: 0.15rem 0 0;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--muted);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.project-desc-empty {
		margin: 0.15rem 0 0;
		font-size: 0.88rem;
		color: #5a7178;
		font-style: italic;
	}

	.project-desc-err {
		margin: 0;
		font-size: 0.85rem;
		color: #b02a37;
	}

	.project-desc-actions {
		display: flex;
		gap: 0.45rem;
		align-items: center;
	}

	.project-desc-save {
		align-self: flex-start;
		border: none;
		border-radius: 8px;
		padding: 0.45rem 0.85rem;
		background: #0a5f63;
		color: #fff;
		font-weight: 700;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.project-desc-save:hover:not(:disabled) {
		background: #084b4e;
	}

	.project-desc-save:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.project-desc-cancel {
		border: 1px solid rgba(7, 65, 68, 0.18);
		border-radius: 8px;
		padding: 0.45rem 0.85rem;
		background: #fff;
		color: #3a545c;
		font-weight: 700;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.project-desc-cancel:hover:not(:disabled) {
		background: rgba(10, 95, 99, 0.04);
	}

	.cohort-sub {
		margin: 0.45rem 0 0;
		font-family: GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.98rem;
		line-height: 1.4;
		color: var(--soft);
	}

	.role-chip {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.3rem;
		padding: 0.85rem 1rem;
		background: linear-gradient(145deg, rgba(10, 95, 99, 0.08), rgba(10, 95, 99, 0.03));
		border: 1px solid rgba(10, 95, 99, 0.16);
		border-radius: 12px;
		min-width: 9.5rem;
	}

	.role-label {
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-deep);
		opacity: 0.8;
	}

	.role-title {
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 1.02rem;
		font-weight: 700;
		color: var(--accent-deep);
		text-align: right;
		line-height: 1.25;
	}

	.seat-foot {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem 2.5rem;
		padding: 1.15rem 1.75rem 1.35rem 1.9rem;
		background: linear-gradient(180deg, rgba(217, 232, 230, 0.35), rgba(217, 232, 230, 0.55));
		border-top: 1px solid rgba(7, 65, 68, 0.08);
	}

	.seat-foot-members {
		flex-wrap: nowrap;
		align-items: flex-start;
		gap: 1.25rem 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.dates-stat {
		flex-shrink: 0;
	}

	.stat-label {
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.stat-value {
		font-family: GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.98rem;
		font-weight: 600;
		color: var(--ink);
		line-height: 1.3;
	}

	.dates-stat .date-months {
		display: block;
		white-space: nowrap;
	}

	.date-year {
		display: block;
		margin-top: 0.15rem;
		font-family: Fraunces, Georgia, serif;
		font-size: 1.55rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1;
		color: var(--accent-deep);
	}

	.members-block {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.members-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.exit-view {
		border: none;
		background: transparent;
		padding: 0;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--accent-deep);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.members-empty {
		margin: 0;
		font-size: 0.88rem;
		color: #5a7178;
	}

	.members-scroll {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.55rem;
		overflow-x: auto;
		overflow-y: hidden;
		padding-bottom: 0.2rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
	}

	.member-chip {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.12rem;
		min-width: 7.5rem;
		max-width: 11rem;
		padding: 0.55rem 0.7rem;
		border-radius: 10px;
		border: 1px solid rgba(7, 65, 68, 0.14);
		background: rgba(255, 255, 255, 0.72);
		font: inherit;
		text-align: left;
		cursor: pointer;
		color: inherit;
	}

	.member-chip:hover {
		border-color: rgba(10, 95, 99, 0.35);
		background: #fff;
	}

	.member-chip.selected {
		border-color: #0a5f63;
		background: #fff;
		box-shadow: 0 0 0 2px rgba(10, 95, 99, 0.18);
	}

	.member-chip.pending {
		border-style: dashed;
		opacity: 0.92;
	}

	.member-name {
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.member-role {
		font-size: 0.72rem;
		color: #5a7178;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.member-status {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #a16207;
	}

	.member-chip.is-you {
		border-color: rgba(10, 95, 99, 0.28);
		background: rgba(10, 95, 99, 0.06);
	}

	.member-you {
		margin-left: 0.35rem;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent);
	}

	@media (max-width: 640px) {
		.seat-foot-members {
			flex-wrap: wrap;
		}

		.members-block {
			flex: 1 1 100%;
		}
	}

	.sprint-band {
		padding: 1.25rem 1.5rem 1.45rem;
		background: linear-gradient(160deg, #0a4548 0%, #0f6f73 55%, #0c5a5d 100%);
		color: #f7fffe;
	}

	.sprint-kicker {
		margin: 0 0 0.85rem;
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(247, 255, 254, 0.75);
	}

	.track {
		display: flex;
		align-items: center;
		width: 100%;
	}

	.node {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		color: #f7fffe;
		flex-shrink: 0;
	}

	.node-n {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 2px solid rgba(247, 255, 254, 0.92);
		background: rgba(7, 40, 42, 0.28);
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: #f7fffe;
	}

	.node-label {
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #f7fffe;
		opacity: 0.95;
		white-space: nowrap;
	}

	.connector {
		flex: 1;
		height: 2px;
		min-width: 0.5rem;
		background: linear-gradient(90deg, rgba(247, 255, 254, 0.9), rgba(247, 255, 254, 0.35));
		margin-bottom: 1.15rem;
	}

	.node.is-active .node-n {
		background: #f7fffe;
		color: #074144;
		border-color: #f7fffe;
		box-shadow: 0 0 0 3px rgba(247, 255, 254, 0.25);
	}

	.node.is-active .node-label {
		font-weight: 700;
	}

	.active-goal {
		margin: 1rem 0 0;
		padding-top: 0.85rem;
		border-top: 1px solid rgba(247, 255, 254, 0.2);
		font-family: GreyCliffCF-Regular, system-ui, sans-serif;
		font-size: 0.95rem;
		line-height: 1.45;
		color: rgba(247, 255, 254, 0.95);
	}

	.active-goal span {
		display: block;
		margin-bottom: 0.25rem;
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(247, 255, 254, 0.7);
	}

	.status {
		display: inline-block;
		width: fit-content;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-applied {
		background: #fff3cd;
		color: #8a6d00;
	}

	.status-assigned {
		background: #d7f0f1;
		color: #074144;
	}

	.others {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.other-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: rgba(251, 255, 254, 0.8);
		border: 1px solid rgba(7, 65, 68, 0.1);
		border-radius: 12px;
	}

	.other-title {
		display: block;
		font-family: GreyCliffCF-Bold, system-ui, sans-serif;
		font-weight: 700;
		color: var(--ink);
	}

	.other-role {
		display: block;
		margin-top: 0.2rem;
		font-size: 0.88rem;
		color: var(--soft);
	}

	@media (max-width: 640px) {
		.seat-top {
			flex-direction: column;
		}

		.role-chip {
			align-items: flex-start;
			width: 100%;
		}

		.role-title {
			text-align: left;
		}

		.node-label {
			display: none;
		}

		.connector {
			margin-bottom: 0;
		}

		.node-n {
			width: 2.15rem;
			height: 2.15rem;
			font-size: 0.7rem;
		}
	}
</style>
