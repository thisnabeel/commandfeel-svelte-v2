<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';

	/** @type {number|string|null} */
	export let cohortUserId = null;
	/** Teacher view: browse only, no create/edit/archive */
	export let readOnly = false;

	let items = [];
	let loading = true;
	let error = '';
	let titleInput = '';
	let urlInput = '';
	let descriptionInput = '';
	let submitting = false;
	let formError = '';
	/** @type {string|null} */
	let loadedKey = null;
	/** @type {string[]} */
	let openIds = [];
	/** @type {number|string|null} */
	let editingId = null;
	/** @type {string} */
	let editTitle = '';
	/** @type {string} */
	let editUrl = '';
	/** @type {string} */
	let editDescription = '';
	/** @type {number|string|null} */
	let savingId = null;
	/** @type {number|string|null} */
	let archivingId = null;

	function seatKey(id) {
		return id == null ? null : String(id);
	}

	function toggle(id) {
		const key = String(id);
		openIds = openIds.includes(key) ? openIds.filter((x) => x !== key) : [...openIds, key];
	}

	async function load() {
		const key = seatKey(cohortUserId);
		if (!$user || !key) {
			items = [];
			loading = false;
			loadedKey = null;
			return;
		}
		if (loadedKey === key) return;

		try {
			loading = true;
			error = '';
			const list = await Api.get(`/cohort_users/${cohortUserId}/cohort_user_jobs`);
			if (seatKey(cohortUserId) !== key) return;
			items = Array.isArray(list) ? list : [];
			loadedKey = key;
		} catch (err) {
			if (seatKey(cohortUserId) !== key) return;
			error =
				err?.response?.data?.error ||
				err?.response?.data?.errors?.join?.(', ') ||
				err?.message ||
				'Failed to load interesting jobs';
			items = [];
			loadedKey = null;
		} finally {
			if (seatKey(cohortUserId) === key) loading = false;
		}
	}

	onMount(() => {
		load();
	});

	$: if (cohortUserId && $user && loadedKey !== seatKey(cohortUserId)) {
		load();
	}

	async function addJob() {
		if (!$user || !cohortUserId || submitting) return;
		const title = titleInput.trim();
		const url = urlInput.trim();
		const description = descriptionInput.trim();
		if (!title) {
			formError = 'Please enter a title.';
			return;
		}
		if (!url) {
			formError = 'Please enter a job posting URL.';
			return;
		}
		try {
			submitting = true;
			formError = '';
			const created = await Api.post(`/cohort_users/${cohortUserId}/cohort_user_jobs`, {
				cohort_user_job: { title, url, description: description || null }
			});
			if (!created?.id) throw new Error('Empty job returned');
			items = [...items, created];
			titleInput = '';
			urlInput = '';
			descriptionInput = '';
			if (created.description) {
				openIds = [...openIds, String(created.id)];
			}
		} catch (err) {
			formError =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not add job.';
		} finally {
			submitting = false;
		}
	}

	function startEdit(job) {
		editingId = job.id;
		editTitle = job.title || '';
		editUrl = job.url || '';
		editDescription = job.description || '';
		const key = String(job.id);
		if (!openIds.includes(key)) openIds = [...openIds, key];
	}

	function cancelEdit() {
		editingId = null;
		editTitle = '';
		editUrl = '';
		editDescription = '';
	}

	async function saveEdit(job) {
		if (!job?.id || savingId) return;
		const title = editTitle.trim();
		const url = editUrl.trim();
		const description = editDescription.trim();
		if (!title || !url) return;
		try {
			savingId = job.id;
			const updated = await Api.patch(`/cohort_user_jobs/${job.id}`, {
				cohort_user_job: { title, url, description: description || null }
			});
			items = items.map((j) => (j.id === job.id ? { ...j, ...updated } : j));
			cancelEdit();
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not update job.';
		} finally {
			savingId = null;
		}
	}

	async function archiveJob(job) {
		if (!job?.id || archivingId) return;
		try {
			archivingId = job.id;
			await Api.patch(`/cohort_user_jobs/${job.id}`, {
				cohort_user_job: { archive: true }
			});
			items = items.filter((j) => j.id !== job.id);
			if (editingId === job.id) cancelEdit();
			openIds = openIds.filter((x) => x !== String(job.id));
		} catch (err) {
			error =
				err?.response?.data?.errors?.join?.(', ') ||
				err?.response?.data?.error ||
				err?.message ||
				'Could not remove job.';
		} finally {
			archivingId = null;
		}
	}

	function hostOf(url) {
		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return url;
		}
	}

	function hasDescription(job) {
		return !!(job?.description && String(job.description).trim());
	}
</script>

<div class="panel">
	{#if !readOnly}
		<form class="add-form" on:submit|preventDefault={addJob}>
			<input
				type="text"
				class="field"
				placeholder="Title — e.g. QA Engineer at Acme"
				bind:value={titleInput}
				disabled={submitting}
			/>
			<input
				type="url"
				class="field"
				placeholder="Job URL — LinkedIn or Greenhouse link"
				bind:value={urlInput}
				disabled={submitting}
			/>
			<textarea
				class="field area"
				rows="3"
				placeholder="Copy paste the job description"
				bind:value={descriptionInput}
				disabled={submitting}
			/>
			{#if formError}
				<p class="status err">{formError}</p>
			{/if}
			<button type="submit" class="add-btn" disabled={submitting || !cohortUserId}>
				<span class="add-icon">+</span>
				{submitting ? 'Adding…' : 'Add Job'}
			</button>
		</form>
	{/if}

	{#if loading}
		<p class="status">Loading jobs…</p>
	{:else if error}
		<p class="status err">{error}</p>
	{:else if items.length === 0}
		<p class="status">No interesting jobs yet. Paste a LinkedIn or Greenhouse link above.</p>
	{:else}
		<ul class="list">
			{#each items as job (job.id)}
				<li class="item" class:open={openIds.includes(String(job.id))}>
					{#if editingId === job.id}
						<div class="edit-body">
							<input
								type="text"
								class="field"
								bind:value={editTitle}
								disabled={savingId === job.id}
							/>
							<input
								type="url"
								class="field"
								bind:value={editUrl}
								disabled={savingId === job.id}
							/>
							<textarea
								class="field area"
								rows="4"
								placeholder="Job description"
								bind:value={editDescription}
								disabled={savingId === job.id}
							/>
							<div class="edit-actions">
								<button
									type="button"
									class="save"
									disabled={savingId === job.id}
									on:click={() => saveEdit(job)}
								>
									{savingId === job.id ? 'Saving…' : 'Save'}
								</button>
								<button type="button" class="cancel" on:click={cancelEdit}>Cancel</button>
							</div>
						</div>
					{:else}
						<div class="item-head">
							<button
								type="button"
								class="toggle"
								aria-expanded={openIds.includes(String(job.id))}
								on:click={() => toggle(job.id)}
							>
								<span class="chev" aria-hidden="true"
									>{openIds.includes(String(job.id)) ? '▾' : '▸'}</span
								>
								<span class="titles">
									<span class="title">{job.title}</span>
									<span class="host">{hostOf(job.url)}</span>
								</span>
							</button>
							<div class="actions">
								<a
									class="icon-btn"
									href={job.url}
									target="_blank"
									rel="noopener noreferrer"
									title="Open posting"
									aria-label="Open job posting"
								>
									<i class="fa fa-external-link" />
								</a>
								{#if !readOnly}
									<button
										type="button"
										class="icon-btn"
										title="Edit"
										aria-label="Edit job"
										on:click={() => startEdit(job)}
									>
										<i class="fa fa-pencil" />
									</button>
									<button
										type="button"
										class="icon-btn danger"
										title="Remove"
										aria-label="Remove job"
										disabled={archivingId === job.id}
										on:click={() => archiveJob(job)}
									>
										<i class="fa fa-trash" />
									</button>
								{/if}
							</div>
						</div>
						{#if openIds.includes(String(job.id))}
							<div class="card-body">
								{#if hasDescription(job)}
									<p class="description">{job.description}</p>
								{:else}
									<p class="description empty">No description yet. Edit to add one.</p>
								{/if}
							</div>
						{/if}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.panel {
		width: 100%;
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		margin-bottom: 1rem;
	}

	.field {
		width: 100%;
		box-sizing: border-box;
		padding: 0.65rem 0.8rem;
		border: 1px solid rgba(7, 65, 68, 0.18);
		border-radius: 8px;
		font: inherit;
		font-size: 0.92rem;
		background: #fff;
		color: #071416;
	}

	.field.area {
		resize: vertical;
		min-height: 4.5rem;
		line-height: 1.45;
	}

	.field:focus {
		outline: none;
		border-color: rgba(10, 95, 99, 0.45);
		box-shadow: 0 0 0 3px rgba(10, 95, 99, 0.1);
	}

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		width: 100%;
		margin: 0;
		padding: 0.7rem 1rem;
		border: none;
		border-radius: 8px;
		background: #0a5f63;
		color: #fff;
		font-weight: 700;
		font-size: 0.88rem;
		letter-spacing: 0.02em;
		cursor: pointer;
	}

	.add-btn:hover:not(:disabled) {
		background: #084b4e;
	}

	.add-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.add-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.list {
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

	.item-head {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.toggle {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		border: none;
		background: transparent;
		padding: 0.85rem 0.5rem 0.85rem 0.95rem;
		text-align: left;
		cursor: pointer;
		font: inherit;
		color: inherit;
		flex: 1;
		min-width: 0;
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
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}

	.title {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 0.98rem;
		letter-spacing: -0.02em;
		color: #071416;
		word-break: break-word;
	}

	.host {
		font-size: 0.72rem;
		color: #5a7178;
		line-height: 1.35;
		word-break: break-all;
	}

	.actions {
		display: flex;
		gap: 0.2rem;
		flex-shrink: 0;
		margin: 0.7rem 0.75rem 0 0;
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
		text-decoration: none;
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

	.card-body {
		padding: 0 0.95rem 0.9rem 2.05rem;
	}

	.description {
		margin: 0;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		background: rgba(10, 95, 99, 0.07);
		font-size: 0.88rem;
		line-height: 1.45;
		color: #234047;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.description.empty {
		background: transparent;
		color: #5a7178;
		font-style: italic;
		padding-left: 0;
	}

	.edit-body {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		padding: 0.85rem 0.95rem;
	}

	.edit-actions {
		display: flex;
		gap: 0.4rem;
	}

	.save,
	.cancel {
		border-radius: 6px;
		padding: 0.35rem 0.7rem;
		font-size: 0.78rem;
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

	.status {
		margin: 0.5rem 0 0;
		font-size: 0.92rem;
		color: #3a545c;
	}

	.status.err {
		color: #b02a37;
	}
</style>
