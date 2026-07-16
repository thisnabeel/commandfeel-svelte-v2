<script>
	import TreeNode from './TreeNode.svelte';
	import { user, credsView } from '$lib/stores/user';
	import {
		flattenWithAncestors,
		labelOf,
		matchesQuery,
		highlightParts,
		expandPathIds,
		breadcrumbPath
	} from './treeSearch.js';

	export let occupation;
	export let tree = [];
	/** @type {Set<number>|number[]} */
	export let notedIds = new Set();
	export let onNotePresence = (_id, _hasNote) => {};
	/** @type {Set<number|string>|Array<number|string>} */
	export let approvedEvidenceIds = new Set();
	export let onEvidencePresence = (_id, _hasApproved) => {};
	export let showHeader = true;
	/** @type {Record<string|number, number>|Map<any, number>} */
	export let unresolvedBySkillId = {};
	export let onUnresolvedChange = (_id, _count) => {};
	export let cohortId = null;

	let searchQuery = '';
	/** @type {Set<number|string>} */
	let forceExpandedIds = new Set();
	/** @type {number|string|null} */
	let scrollToId = null;

	$: signedIn = !!$user;
	$: flat = flattenWithAncestors(tree);
	$: trimmedQuery = (searchQuery || '').trim();
	$: searching = trimmedQuery.length > 0;
	$: searchResults = searching
		? flat.filter((row) => matchesQuery(labelOf(row.item), trimmedQuery))
		: [];

	function openSignIn() {
		credsView.set('signIn');
	}

	function unresolvedFor(id) {
		if (!id) return 0;
		if (unresolvedBySkillId instanceof Map) {
			return unresolvedBySkillId.get(id) || unresolvedBySkillId.get(String(id)) || 0;
		}
		return unresolvedBySkillId?.[id] || unresolvedBySkillId?.[String(id)] || 0;
	}

	function hasNote(id) {
		return notedIds instanceof Set ? notedIds.has(id) : (notedIds || []).includes(id);
	}

	function hasApprovedEvidence(id) {
		if (!id) return false;
		if (approvedEvidenceIds instanceof Set) {
			return approvedEvidenceIds.has(id) || approvedEvidenceIds.has(String(id));
		}
		return (
			(approvedEvidenceIds || []).includes(id) || (approvedEvidenceIds || []).includes(String(id))
		);
	}

	function focusNode(targetId) {
		const expandIds = expandPathIds(flat, targetId);
		forceExpandedIds = new Set([...expandIds, targetId]);
		// Bump scroll by clearing then setting so the same id can be re-focused.
		scrollToId = null;
		requestAnimationFrame(() => {
			scrollToId = targetId;
		});
		searchQuery = '';
	}

	function onCrumbClick(id) {
		focusNode(id);
	}

	function onResultLabelClick(itemId) {
		focusNode(itemId);
	}

	function onScrolledTo(_id) {
		// Keep forceExpandedIds so the path stays open; clear scroll token after focus.
		scrollToId = null;
	}

	function clearSearch() {
		searchQuery = '';
	}
</script>

<article class="reader" class:compact={!showHeader}>
	{#if showHeader}
		<header class="hero">
			<p class="eyebrow">Occupation</p>
			<h1>{occupation.title}</h1>
			{#if occupation.subtitle}
				<p class="subtitle">{occupation.subtitle}</p>
			{/if}
			{#if occupation.average_salary_range}
				<p class="salary">{occupation.average_salary_range}</p>
			{/if}
			{#if occupation.description}
				<p class="lede">{occupation.description}</p>
			{/if}
		</header>
	{/if}

	{#if tree.length === 0}
		<p class="empty">No skills mapped for this occupation yet.</p>
	{:else}
		<p class="legend" role="note">
			{#if !signedIn}
				<button type="button" class="signin-link" on:click={openSignIn}>Sign in</button>
				to add notes.
				<span class="sep" aria-hidden="true">·</span>
				Click any row to expand.
			{:else}
				Click any row to add notes.
			{/if}
			<span class="sep" aria-hidden="true">·</span>
			Click the
			<span class="uni-sample" title="University skill" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="11" height="11">
					<path
						fill="currentColor"
						d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
					/>
				</svg>
			</span>
			icon to learn more about that skill.
		</p>

		<div class="search-bar">
			<label class="search-label" for="vocab-search">Search skills</label>
			<div class="search-field">
				<svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
					<path
						fill="currentColor"
						d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
					/>
				</svg>
				<input
					id="vocab-search"
					type="search"
					placeholder="Find a skill…"
					autocomplete="off"
					spellcheck="false"
					bind:value={searchQuery}
				/>
				{#if searching}
					<button type="button" class="clear-btn" on:click={clearSearch}>Clear</button>
				{/if}
			</div>
		</div>

		<section class="outline" aria-label="Skill outline">
			{#if searching}
				{#if searchResults.length === 0}
					<p class="empty search-empty">No skills match “{trimmedQuery}”.</p>
				{:else}
					<ul class="results">
						{#each searchResults as row (row.item.id)}
							{@const crumbs = breadcrumbPath(row.ancestors, row.item)}
							{@const parts = highlightParts(labelOf(row.item), trimmedQuery)}
							{@const qCount = unresolvedFor(row.item.id)}
							<li class="result">
								{#if row.ancestors.length > 0}
									<nav class="crumbs" aria-label="Ancestry">
										{#each crumbs as crumb, i}
											{#if i > 0}
												<span class="crumb-sep" aria-hidden="true">›</span>
											{/if}
											<button
												type="button"
												class="crumb"
												class:current={i === crumbs.length - 1}
												on:click={() => onCrumbClick(crumb.id)}
											>
												{crumb.label}
											</button>
										{/each}
									</nav>
								{/if}
								<div class="result-row">
									{#if hasApprovedEvidence(row.item.id)}
										<span
											class="evidence-star"
											title="Approved evidence"
											aria-label="Has approved evidence"
										>
											<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
												<path
													fill="currentColor"
													d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z"
												/>
											</svg>
										</span>
									{/if}
									<button
										type="button"
										class="result-label"
										class:evidence-approved={hasApprovedEvidence(row.item.id)}
										on:click={() => onResultLabelClick(row.item.id)}
									>
										{#each parts as part}
											{#if part.hit}
												<mark>{part.text}</mark>
											{:else}
												{part.text}
											{/if}
										{/each}
									</button>
									{#if row.item.skill_id}
										<span class="uni-badge" title="Linked university skill" aria-hidden="true">
											<svg viewBox="0 0 24 24" width="12" height="12">
												<path
													fill="currentColor"
													d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
												/>
											</svg>
										</span>
									{/if}
									{#if qCount > 0}
										<span class="q-badge" title="{qCount} unresolved">
											{qCount > 9 ? '9+' : qCount}
										</span>
									{/if}
									{#if hasNote(row.item.id)}
										<span class="note-dot" title="Has notes" aria-hidden="true" />
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			{:else}
				<ul class="roots">
					{#each tree as item}
						<TreeNode
							{item}
							depth={0}
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
		</section>
	{/if}
</article>

<style>
	.reader {
		max-width: 46rem;
		margin: 0 auto;
		padding: 0.5rem 0 3rem;
	}

	.reader.compact {
		max-width: none;
		padding: 0.25rem 0 0.5rem;
	}

	.hero {
		margin-bottom: 1.5rem;
		padding-bottom: 1.75rem;
		border-bottom: 1px solid rgba(15, 23, 42, 0.08);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 0.45rem;
		margin: 0 0 1rem;
		padding: 0.7rem 0.9rem;
		border-radius: 10px;
		background: rgba(15, 118, 110, 0.06);
		border: 1px solid rgba(15, 118, 110, 0.12);
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.88rem;
		line-height: 1.45;
		color: #475569;
	}

	.search-bar {
		margin: 0 0 1.25rem;
	}

	.search-label {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.search-field {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 0.65rem;
		border: 1px solid rgba(15, 118, 110, 0.28);
		border-radius: 10px;
		background: #fff;
	}

	.search-field:focus-within {
		border-color: #0f766e;
		box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
	}

	.search-icon {
		flex-shrink: 0;
		color: #0f766e;
		opacity: 0.85;
	}

	.search-field input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		font: inherit;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.95rem;
		color: #0f172a;
	}

	.clear-btn {
		flex-shrink: 0;
		border: none;
		background: rgba(15, 118, 110, 0.1);
		color: #0f766e;
		font: inherit;
		font-size: 0.78rem;
		font-weight: 700;
		padding: 0.25rem 0.55rem;
		border-radius: 6px;
		cursor: pointer;
	}

	.clear-btn:hover {
		background: rgba(15, 118, 110, 0.18);
	}

	.results {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.result {
		padding: 0.55rem 0.65rem;
		border-radius: 10px;
		border: 1px solid rgba(15, 118, 110, 0.12);
		background: rgba(255, 255, 255, 0.85);
	}

	.crumbs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.2rem 0.15rem;
		margin: 0 0 0.35rem;
	}

	.crumb {
		border: none;
		background: none;
		padding: 0;
		margin: 0;
		font: inherit;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.78rem;
		font-weight: 600;
		color: #0f766e;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}

	.crumb.current {
		color: #334155;
		text-decoration: none;
		cursor: pointer;
	}

	.crumb:hover {
		color: #0a5c60;
	}

	.crumb-sep {
		color: #94a3b8;
		font-size: 0.75rem;
		padding: 0 0.1rem;
	}

	.result-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.result-label {
		border: none;
		background: none;
		padding: 0;
		margin: 0;
		text-align: left;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: #0f172a;
		cursor: pointer;
		line-height: 1.3;
	}

	.result-label.evidence-approved {
		padding-bottom: 0.12em;
		border-bottom: 1.5px dashed #22c55e;
	}

	.evidence-star {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #fbbf24;
		filter: drop-shadow(0 0 3px rgba(251, 191, 36, 0.95))
			drop-shadow(0 0 8px rgba(250, 204, 21, 0.75))
			drop-shadow(0 0 14px rgba(245, 158, 11, 0.45));
		animation: star-glow 2.2s ease-in-out infinite;
	}

	.evidence-star svg {
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

	.result-label:hover {
		color: #0f766e;
	}

	.result-label :global(mark) {
		background: #fde68a;
		color: #071416;
		padding: 0.05em 0.12em;
		border-radius: 3px;
	}

	.uni-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.35rem;
		height: 1.35rem;
		border-radius: 999px;
		background: #0f766e;
		color: #fff;
		flex-shrink: 0;
	}

	.q-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.35rem;
		height: 1.35rem;
		padding: 0 0.35rem;
		border-radius: 999px;
		background: #f59e0b;
		color: #fff;
		font-family: 'Space Grotesk', system-ui, sans-serif;
		font-size: 0.68rem;
		font-weight: 700;
	}

	.note-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: #475569;
		flex-shrink: 0;
	}

	.search-empty {
		margin: 0.5rem 0;
	}

	.signin-link {
		border: none;
		background: none;
		padding: 0;
		margin: 0;
		font: inherit;
		font-weight: 600;
		color: #0f766e;
		text-decoration: underline;
		text-underline-offset: 0.15em;
		cursor: pointer;
	}

	.signin-link:hover {
		color: #0a5c60;
	}

	.sep {
		color: #94a3b8;
		margin: 0 0.1rem;
	}

	.uni-sample {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 999px;
		background: #0f766e;
		color: #fff;
		vertical-align: middle;
	}

	.eyebrow {
		margin: 0 0 0.65rem;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #0f766e;
	}

	h1 {
		margin: 0;
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(2.4rem, 5vw, 3.4rem);
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 1.05;
		color: #0f172a;
	}

	.subtitle {
		margin: 0.75rem 0 0;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 1.2rem;
		color: #475569;
	}

	.salary {
		display: inline-block;
		margin: 1rem 0 0;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: #0f766e;
		letter-spacing: -0.01em;
	}

	.lede {
		margin: 1.25rem 0 0;
		max-width: 38rem;
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		font-size: 1.05rem;
		line-height: 1.65;
		color: #64748b;
	}

	.empty {
		font-family: GreyCliffCF-Regular, 'GreycliffCF-Regular', system-ui, sans-serif;
		color: #94a3b8;
	}

	.roots {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
</style>
