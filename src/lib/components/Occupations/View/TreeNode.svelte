<script>
	import SkillPreview from './SkillPreview.svelte';
	import { user, credsView } from '$lib/stores/user';
	import { tick } from 'svelte';

	export let item;
	export let depth = 0;
	/** @type {Set<number>} */
	export let notedIds = new Set();
	export let onNotePresence = (_id, _hasNote) => {};
	/** @type {Set<number|string>} */
	export let approvedEvidenceIds = new Set();
	export let onEvidencePresence = (_id, _hasApproved) => {};
	/** @type {Record<string|number, number>|Map<any, number>} */
	export let unresolvedBySkillId = {};
	export let onUnresolvedChange = (_id, _count) => {};
	/** @type {Set<number|string>} */
	export let forceExpandedIds = new Set();
	/** @type {number|string|null} */
	export let scrollToId = null;
	export let onScrolledTo = (_id) => {};
	export let cohortId = null;

	let collapsed = depth > 1;
	let previewOpen = false;
	let noContentHint = false;
	/** @type {string|null} */
	let previewInitialTab = null;
	/** @type {HTMLElement|null} */
	let rowEl = null;
	let flash = false;
	let lastFocusToken = null;

	$: isSignedIn = !!$user;
	$: isLinked = !!item.skill_id;
	$: canExpand = true;
	$: hasNote = notedIds instanceof Set ? notedIds.has(item.id) : (notedIds || []).includes(item.id);
	$: hasApprovedEvidence =
		approvedEvidenceIds instanceof Set
			? approvedEvidenceIds.has(item.id) || approvedEvidenceIds.has(String(item.id))
			: (approvedEvidenceIds || []).includes(item.id) ||
				(approvedEvidenceIds || []).includes(String(item.id));
	$: unresolvedCount =
		unresolvedBySkillId instanceof Map
			? unresolvedBySkillId.get(item.id) || unresolvedBySkillId.get(String(item.id)) || 0
			: unresolvedBySkillId?.[item.id] || unresolvedBySkillId?.[String(item.id)] || 0;
	$: label = item.display_title || item.title || item.skill_title || 'Untitled';
	$: hasChildren = (item.skills || []).length > 0;
	$: headingLevel = Math.min(depth + 2, 6);

	$: if (
		forceExpandedIds instanceof Set &&
		(forceExpandedIds.has(item.id) || forceExpandedIds.has(String(item.id)))
	) {
		collapsed = false;
	}

	$: if (
		scrollToId != null &&
		(scrollToId === item.id || String(scrollToId) === String(item.id)) &&
		lastFocusToken !== scrollToId
	) {
		lastFocusToken = scrollToId;
		scrollIntoFocus();
	}

	$: if (scrollToId == null) {
		lastFocusToken = null;
	}

	async function scrollIntoFocus() {
		await tick();
		await tick();
		if (!rowEl) return;
		rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
		flash = true;
		onScrolledTo(item.id);
		setTimeout(() => {
			flash = false;
		}, 1600);
	}

	function toggle(e) {
		e.stopPropagation();
		collapsed = !collapsed;
	}

	function onLabelClick() {
		noContentHint = false;
		previewInitialTab = null;
		previewOpen = !previewOpen;
	}

	function onNoteRelatedClick(e) {
		e.stopPropagation();
		if (!isSignedIn) {
			credsView.set('signIn');
			return;
		}
		noContentHint = false;
		previewInitialTab = null;
		previewOpen = true;
	}

	function onUnresolvedClick(e) {
		e.stopPropagation();
		if (!isSignedIn) {
			credsView.set('signIn');
			return;
		}
		noContentHint = false;
		previewInitialTab = 'questions';
		previewOpen = true;
	}

	function onPreviewEmpty() {
		// Keep open so My Notes (or sign-in gate) remains available.
	}
</script>

<li
	class="node"
	class:has-children={hasChildren}
	class:linked={isLinked}
	class:expandable={canExpand}
	class:preview-open={previewOpen}
	class:depth-0={depth === 0}
	class:depth-1={depth === 1}
	class:depth-2={depth === 2}
	class:depth-deep={depth >= 3}
	class:flash={flash}
	bind:this={rowEl}
>
	<div class="node-row">
		{#if hasChildren}
			<button
				type="button"
				class="caret"
				aria-label={collapsed ? 'Expand' : 'Collapse'}
				aria-expanded={!collapsed}
				on:click={toggle}
			>
				<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
					<path
						d={collapsed ? 'M6 3l5 5-5 5' : 'M3 6l5 5 5-5'}
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		{:else if hasApprovedEvidence}
			<span
				class="dot evidence-star"
				title="Approved evidence"
				aria-label="Has approved evidence"
			>
				<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
					<path
						fill="currentColor"
						d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z"
					/>
				</svg>
			</span>
		{:else}
			<span class="dot" aria-hidden="true" />
		{/if}

		{#if headingLevel === 2}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<h2
				class="label"
				class:clickable={canExpand}
				class:evidence-approved={hasApprovedEvidence}
				on:click={onLabelClick}
			>
				{label}
			</h2>
		{:else if headingLevel === 3}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<h3
				class="label"
				class:clickable={canExpand}
				class:evidence-approved={hasApprovedEvidence}
				on:click={onLabelClick}
			>
				{label}
			</h3>
		{:else if headingLevel === 4}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<h4
				class="label"
				class:clickable={canExpand}
				class:evidence-approved={hasApprovedEvidence}
				on:click={onLabelClick}
			>
				{label}
			</h4>
		{:else}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<h5
				class="label"
				class:clickable={canExpand}
				class:evidence-approved={hasApprovedEvidence}
				on:click={onLabelClick}
			>
				{label}
			</h5>
		{/if}

		{#if isLinked}
			<button
				type="button"
				class="uni-badge"
				class:active={previewOpen}
				title="Show linked skill content"
				aria-expanded={previewOpen}
				on:click|stopPropagation={onLabelClick}
			>
				<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
					<path
						fill="currentColor"
						d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
					/>
				</svg>
			</button>
		{/if}

		{#if unresolvedCount > 0}
			<button
				type="button"
				class="q-badge"
				class:active={previewOpen}
				title="{unresolvedCount} unresolved question{unresolvedCount === 1 ? '' : 's'}"
				aria-label="{unresolvedCount} unresolved questions"
				on:click={onUnresolvedClick}
			>
				<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
					<path
						fill="currentColor"
						d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
					/>
				</svg>
				<span class="q-count">{unresolvedCount > 9 ? '9+' : unresolvedCount}</span>
			</button>
		{/if}

		{#if hasNote}
			<button
				type="button"
				class="note-indicator"
				class:active={previewOpen}
				title={isSignedIn ? 'Has notes' : 'Sign in to view notes'}
				aria-label={isSignedIn ? 'Open notes' : 'Sign in to view notes'}
				on:click={onNoteRelatedClick}
			>
				<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
					<path
						fill="currentColor"
						d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8v-2zm0 4h8v2H8v-2zm0-8h5v2H8V8z"
					/>
				</svg>
			</button>
		{/if}
	</div>

	{#if item.description}
		<p class="desc">{item.description}</p>
	{/if}

	{#if noContentHint}
		<p class="no-content">No abstractions or phrases for this skill yet.</p>
	{/if}

	{#if canExpand && previewOpen}
		<SkillPreview
			occupationSkillId={item.id}
			skillId={item.skill_id || null}
			{onNotePresence}
			{onEvidencePresence}
			{onUnresolvedChange}
			{unresolvedCount}
			{cohortId}
			initialTab={previewInitialTab}
			on:empty={onPreviewEmpty}
		/>
	{/if}

	{#if hasChildren && !collapsed}
		<ul class="children">
			{#each item.skills as child}
				<svelte:self
					item={child}
					depth={depth + 1}
					{notedIds}
					{onNotePresence}
					{approvedEvidenceIds}
					{onEvidencePresence}
					{unresolvedBySkillId}
					{onUnresolvedChange}
					{forceExpandedIds}
					{scrollToId}
					{onScrolledTo}
					{cohortId}
				/>
			{/each}
		</ul>
	{/if}
</li>

<style>
	.node {
		list-style: none;
		margin: 0;
		padding: 0;
		border-radius: 8px;
		transition: background 0.35s ease;
	}

	.node.flash {
		background: rgba(245, 158, 11, 0.18);
		box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35);
	}

	.node-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.55rem;
		padding: 0.35rem 0;
	}

	.uni-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 999px;
		border: none;
		background: #0f766e;
		color: #fff;
		flex-shrink: 0;
		cursor: pointer;
		padding: 0;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.uni-badge:hover,
	.uni-badge.active {
		transform: scale(1.06);
		box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.2);
	}

	.q-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		height: 1.4rem;
		padding: 0 0.4rem 0 0.3rem;
		border-radius: 999px;
		border: none;
		background: #f59e0b;
		color: #fff;
		flex-shrink: 0;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.q-badge:hover,
	.q-badge.active {
		transform: scale(1.06);
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.28);
		background: #d97706;
	}

	.q-count {
		font-family: 'Space Grotesk', system-ui, sans-serif;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1;
	}

	.note-indicator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 999px;
		border: none;
		background: #475569;
		color: #fff;
		flex-shrink: 0;
		cursor: pointer;
		padding: 0;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.note-indicator:hover,
	.note-indicator.active {
		transform: scale(1.06);
		box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.22);
	}

	.caret {
		flex-shrink: 0;
		width: 1.5rem;
		height: 1.5rem;
		margin-top: 0.15rem;
		border: none;
		background: transparent;
		color: #0f766e;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border-radius: 999px;
	}

	.caret:hover {
		background: rgba(15, 118, 110, 0.08);
	}

	.dot {
		flex-shrink: 0;
		width: 1.5rem;
		height: 1.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.dot::before {
		content: '';
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: #94a3b8;
	}

	.dot.evidence-star {
		color: #fbbf24;
		filter: drop-shadow(0 0 3px rgba(251, 191, 36, 0.95))
			drop-shadow(0 0 8px rgba(250, 204, 21, 0.75))
			drop-shadow(0 0 14px rgba(245, 158, 11, 0.45));
		animation: star-glow 2.2s ease-in-out infinite;
	}

	.dot.evidence-star::before {
		display: none;
	}

	.dot.evidence-star svg {
		display: block;
	}

	@keyframes star-glow {
		0%,
		100% {
			filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.85))
				drop-shadow(0 0 6px rgba(250, 204, 21, 0.55))
				drop-shadow(0 0 10px rgba(245, 158, 11, 0.3));
			transform: scale(1);
		}
		50% {
			filter: drop-shadow(0 0 4px rgba(254, 240, 138, 1))
				drop-shadow(0 0 12px rgba(251, 191, 36, 0.95))
				drop-shadow(0 0 20px rgba(245, 158, 11, 0.55));
			transform: scale(1.08);
		}
	}

	.label {
		margin: 0;
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: #0f172a;
		line-height: 1.25;
	}

	.label.evidence-approved {
		display: inline;
		padding-bottom: 0.12em;
		border-bottom: 1.5px dashed #22c55e;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
	}

	.label.clickable {
		cursor: pointer;
	}

	.label.clickable:hover,
	.preview-open > .node-row .label.clickable {
		color: #0f766e;
	}

	.depth-0 > .node-row .label {
		font-size: clamp(1.55rem, 2.4vw, 2rem);
		font-weight: 700;
	}

	.depth-1 > .node-row .label {
		font-size: clamp(1.15rem, 1.8vw, 1.35rem);
		color: #134e4a;
	}

	.depth-2 > .node-row .label {
		font-size: 1.05rem;
		font-weight: 600;
		color: #1e293b;
	}

	.depth-deep > .node-row .label {
		font-size: 0.98rem;
		font-weight: 500;
		color: #334155;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
	}

	.desc {
		margin: 0 0 0.65rem 2.05rem;
		max-width: 40rem;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.95rem;
		line-height: 1.55;
		color: #64748b;
	}

	.no-content {
		margin: 0 0 0.75rem 2.05rem;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.85rem;
		color: #94a3b8;
	}

	.children {
		list-style: none;
		margin: 0 0 0.75rem 1.15rem;
		padding: 0 0 0 1rem;
		border-left: 1px solid rgba(15, 118, 110, 0.18);
	}
</style>
