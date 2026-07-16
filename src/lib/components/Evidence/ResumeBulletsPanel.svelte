<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';

	/** @type {number|string|null} */
	export let occupationId = null;
	/** @type {number|string|null} */
	export let cohortId = null;
	/** Fallbacks from cohort seat when evidence lacks cohort/occupation fields */
	export let occupationTitle = '';
	export let cohortTitle = '';
	export let cohortSubtitle = '';
	export let cohortDescription = '';

	let items = [];
	let loading = true;
	let error = '';
	/** @type {Set<number|string>} */
	let openIds = new Set();
	/** @type {Record<number|string, string>} */
	let genErrors = {};
	/** @type {number|string|null} */
	let generatingId = null;
	/** @type {number|string|null} */
	let editingBulletId = null;
	/** @type {string} */
	let editDraft = '';
	/** @type {number|string|null} */
	let savingBulletId = null;
	/** @type {number|string|null} */
	let deletingBulletId = null;

	function bulletsOf(ev) {
		return Array.isArray(ev?.evidence_bullets) ? ev.evidence_bullets : [];
	}

	async function load() {
		if (!$user || !occupationId) {
			items = [];
			loading = false;
			return;
		}
		try {
			loading = true;
			error = '';
			const params = new URLSearchParams({ occupation_id: String(occupationId) });
			if (cohortId) params.set('cohort_id', String(cohortId));
			const list = await Api.get(`/occupation_skill_evidences/mine_approved?${params}`);
			items = Array.isArray(list) ? list : [];
		} catch (err) {
			error =
				err?.response?.data?.error || err?.message || 'Failed to load approved evidence';
			items = [];
		} finally {
			loading = false;
		}
	}

	function toggle(id) {
		const next = new Set(openIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		openIds = next;
	}

	function isOpen(id) {
		return openIds.has(id);
	}

	function patchEvidence(evId, updater) {
		items = items.map((ev) => (ev.id === evId ? updater(ev) : ev));
	}

	async function generateBullet(ev) {
		if (!ev?.id || generatingId) return;
		try {
			generatingId = ev.id;
			genErrors = { ...genErrors, [ev.id]: '' };
			const payload = {
				occupation_title: occupationTitle || ev.occupation_title || undefined,
				cohort_title: cohortTitle || ev.cohort_title || undefined,
				cohort_subtitle: cohortSubtitle || ev.cohort_subtitle || undefined,
				cohort_description: cohortDescription || ev.cohort_description || undefined
			};
			const created = await Api.post(
				`/occupation_skill_evidences/${ev.id}/resume_bullet`,
				payload
			);
			if (!created?.id) throw new Error('Empty bullet returned');
			patchEvidence(ev.id, (cur) => ({
				...cur,
				evidence_bullets: [...bulletsOf(cur), created]
			}));
			if (!openIds.has(ev.id)) {
				const next = new Set(openIds);
				next.add(ev.id);
				openIds = next;
			}
		} catch (err) {
			genErrors = {
				...genErrors,
				[ev.id]:
					err?.response?.data?.error ||
					err?.message ||
					'Could not generate resume bullet.'
			};
		} finally {
			generatingId = null;
		}
	}

	function startEdit(bullet) {
		editingBulletId = bullet.id;
		editDraft = bullet.body || '';
	}

	function cancelEdit() {
		editingBulletId = null;
		editDraft = '';
	}

	async function saveEdit(ev, bullet) {
		const trimmed = (editDraft || '').trim();
		if (!trimmed || savingBulletId) return;
		try {
			savingBulletId = bullet.id;
			const updated = await Api.patch(`/evidence_bullets/${bullet.id}`, {
				evidence_bullet: { body: trimmed }
			});
			patchEvidence(ev.id, (cur) => ({
				...cur,
				evidence_bullets: bulletsOf(cur).map((b) =>
					b.id === updated.id ? { ...b, ...updated } : b
				)
			}));
			cancelEdit();
		} catch (err) {
			genErrors = {
				...genErrors,
				[ev.id]:
					err?.response?.data?.errors?.join?.(', ') ||
					err?.response?.data?.error ||
					err?.message ||
					'Could not save bullet.'
			};
		} finally {
			savingBulletId = null;
		}
	}

	async function deleteBullet(ev, bullet) {
		if (!bullet?.id || deletingBulletId) return;
		try {
			deletingBulletId = bullet.id;
			await Api.delete(`/evidence_bullets/${bullet.id}`);
			patchEvidence(ev.id, (cur) => ({
				...cur,
				evidence_bullets: bulletsOf(cur).filter((b) => b.id !== bullet.id)
			}));
			if (editingBulletId === bullet.id) cancelEdit();
		} catch (err) {
			genErrors = {
				...genErrors,
				[ev.id]:
					err?.response?.data?.error || err?.message || 'Could not delete bullet.'
			};
		} finally {
			deletingBulletId = null;
		}
	}

	onMount(load);

	let lastKey = undefined;
	$: {
		const key = `${$user?.id ?? 'anon'}:${occupationId || ''}:${cohortId || ''}`;
		if (key !== lastKey) {
			lastKey = key;
			load();
		}
	}
</script>

<div class="panel">
	{#if !$user}
		<p class="status">Sign in to see resume bullets from your approved evidence.</p>
	{:else if loading}
		<p class="status">Loading approved evidence…</p>
	{:else if error}
		<p class="status err" role="alert">{error}</p>
	{:else if items.length === 0}
		<p class="status">
			No approved evidence yet. Submit evidence from Vocabulary and get it approved to unlock
			resume bullets here.
		</p>
	{:else}
		<ul class="accordion" role="list">
			{#each items as ev (ev.id)}
				{@const list = bulletsOf(ev)}
				<li class="item" class:open={isOpen(ev.id)}>
					<button
						type="button"
						class="toggle"
						aria-expanded={isOpen(ev.id)}
						on:click={() => toggle(ev.id)}
					>
						<span class="chev" aria-hidden="true">{isOpen(ev.id) ? '▾' : '▸'}</span>
						<span class="titles">
							<span class="skill">{ev.skill_label || 'Skill'}</span>
							{#if ev.breadcrumb && ev.breadcrumb !== ev.skill_label}
								<span class="crumb">{ev.breadcrumb}</span>
							{/if}
						</span>
					</button>

					<div class="card-body">
						<p class="evidence-body">{ev.body}</p>

						{#if ev.comment}
							<p class="comment">{ev.comment}</p>
						{/if}

						{#if list.length > 0}
							<ul class="bullets">
								{#each list as bullet (bullet.id)}
									<li class="bullet">
										{#if editingBulletId === bullet.id}
											<textarea
												rows="3"
												bind:value={editDraft}
												aria-label="Edit resume bullet"
											/>
											<div class="edit-actions">
												<button
													type="button"
													class="save"
													disabled={savingBulletId === bullet.id || !(editDraft || '').trim()}
													on:click={() => saveEdit(ev, bullet)}
												>
													{savingBulletId === bullet.id ? 'Saving…' : 'Save'}
												</button>
												<button type="button" class="cancel" on:click={cancelEdit}>
													Cancel
												</button>
											</div>
										{:else}
											<p class="bullet-text">{bullet.body}</p>
											<div class="bullet-actions">
												<button
													type="button"
													class="icon-btn"
													title="Edit bullet"
													aria-label="Edit bullet"
													on:click={() => startEdit(bullet)}
												>
													<i class="fa fa-pencil" aria-hidden="true" />
												</button>
												<button
													type="button"
													class="icon-btn danger"
													title="Delete bullet"
													aria-label="Delete bullet"
													disabled={deletingBulletId === bullet.id}
													on:click={() => deleteBullet(ev, bullet)}
												>
													<i class="fa fa-trash" aria-hidden="true" />
												</button>
											</div>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}

						{#if genErrors[ev.id]}
							<p class="status err" role="alert">{genErrors[ev.id]}</p>
						{/if}
					</div>

					<button
						type="button"
						class="wizard"
						disabled={generatingId === ev.id}
						title="Generate resume bullet"
						aria-label="Generate resume bullet for {ev.skill_label || 'skill'}"
						on:click={() => generateBullet(ev)}
					>
						{#if generatingId === ev.id}
							Generating…
						{:else}
							<span class="wiz-icon" aria-hidden="true">✦</span>
							Wizard
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.panel {
		width: 100%;
	}

	.accordion {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.item {
		border: 1px solid rgba(7, 65, 68, 0.12);
		border-radius: 12px;
		background: #fff;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.item.open {
		border-color: rgba(10, 95, 99, 0.28);
	}

	.toggle {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		border: none;
		background: transparent;
		padding: 0.85rem 0.95rem 0.45rem;
		text-align: left;
		cursor: pointer;
		font: inherit;
		color: inherit;
		width: 100%;
	}

	.toggle:hover {
		background: rgba(10, 95, 99, 0.03);
	}

	.chev {
		flex-shrink: 0;
		width: 0.9rem;
		margin-top: 0.15rem;
		color: #0a5f63;
		font-size: 0.85rem;
	}

	.titles {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
		min-width: 0;
	}

	.skill {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 0.98rem;
		letter-spacing: -0.02em;
		color: #071416;
	}

	.crumb {
		font-size: 0.72rem;
		color: #5a7178;
		line-height: 1.35;
		word-break: break-word;
	}

	.card-body {
		padding: 0 0.95rem 0.75rem 2.05rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.evidence-body {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.45;
		color: #071416;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.comment {
		margin: 0;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		background: rgba(10, 95, 99, 0.07);
		font-size: 0.88rem;
		line-height: 1.4;
		color: #234047;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.bullets {
		list-style: none;
		margin: 0.15rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.bullet {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		padding: 0.55rem 0.65rem;
		border-radius: 8px;
		border: 1px solid rgba(7, 65, 68, 0.12);
		background: #f8fbfb;
	}

	.bullet-text {
		flex: 1;
		min-width: 0;
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.45;
		color: #071416;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.bullet-actions {
		display: flex;
		gap: 0.2rem;
		flex-shrink: 0;
	}

	.icon-btn {
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

	.icon-btn:hover {
		background: rgba(10, 95, 99, 0.1);
	}

	.icon-btn.danger {
		color: #b02a37;
	}

	.icon-btn.danger:hover {
		background: rgba(176, 42, 55, 0.08);
	}

	.icon-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.bullet textarea {
		flex: 1;
		min-width: 0;
		box-sizing: border-box;
		padding: 0.5rem 0.6rem;
		border: 1px solid rgba(7, 65, 68, 0.2);
		border-radius: 7px;
		font: inherit;
		font-size: 0.9rem;
		line-height: 1.4;
		resize: vertical;
		background: #fff;
	}

	.edit-actions {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		flex-shrink: 0;
	}

	.save,
	.cancel {
		border-radius: 6px;
		padding: 0.28rem 0.5rem;
		font-size: 0.72rem;
		font-weight: 700;
		cursor: pointer;
	}

	.save {
		border: none;
		background: #0a5f63;
		color: #fff;
	}

	.save:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.cancel {
		border: 1px solid rgba(7, 65, 68, 0.18);
		background: #fff;
		color: #3a545c;
	}

	.wizard {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.4rem;
		width: 100%;
		margin: 0;
		padding: 0.7rem 1rem;
		border: none;
		border-top: 1px solid rgba(7, 65, 68, 0.1);
		border-radius: 0;
		background: #0a5f63;
		color: #fff;
		font-weight: 700;
		font-size: 0.88rem;
		letter-spacing: 0.02em;
		cursor: pointer;
	}

	.wizard:hover:not(:disabled) {
		background: #084b4e;
	}

	.wizard:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.wiz-icon {
		font-size: 0.95rem;
		line-height: 1;
	}

	.status {
		margin: 0;
		font-size: 0.92rem;
		color: #3a545c;
	}

	.status.err {
		color: #b02a37;
	}

	@media (max-width: 640px) {
		.card-body {
			padding-left: 0.95rem;
		}

		.bullet {
			flex-wrap: wrap;
		}

		.edit-actions {
			flex-direction: row;
			width: 100%;
		}
	}
</style>
