<script>
	import { onDestroy, onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import Row from './Row.svelte';
	import { selectedOccupationSkill } from '$lib/stores/occupations/mapper';
	import sticky from '$lib/functions/sticky.js';

	export let occupationId;
	export let skillsCatalog = [];

	let isStuck = false;
	let writing = false;
	let tree = [];
	let loading = true;
	let error = '';
	let newTitle = '';
	let pendingTitles = [];
	let confirmingBulk = false;

	function handleStuck(e) {
		isStuck = e.detail.isStuck;
	}

	function parseBulletTitles(text) {
		return text
			.split(/\r?\n/)
			.map((line) =>
				line
					.replace(/^[\s\u00A0]*([•●▪◦\-\*]|\d+[.)])\s*/, '')
					.replace(/^[\s\u00A0]+/, '')
					.trim()
			)
			.filter(Boolean);
	}

	function handlePaste(e) {
		const text = e.clipboardData?.getData('text') || '';
		const titles = parseBulletTitles(text);
		if (titles.length > 1) {
			e.preventDefault();
			pendingTitles = titles;
			newTitle = '';
		}
	}

	function removePending(index) {
		pendingTitles = pendingTitles.filter((_, i) => i !== index);
	}

	function clearPending() {
		pendingTitles = [];
	}

	async function confirmPending() {
		if (!pendingTitles.length || confirmingBulk) return;

		try {
			confirmingBulk = true;
			error = '';
			const titles = [...pendingTitles];
			const clone = [...tree];
			const virtualRoot = { id: -1, skills: clone };
			const parent = $selectedOccupationSkill?.id
				? findNode(virtualRoot, $selectedOccupationSkill)
				: null;

			let position = parent ? parent.skills.length + 1 : clone.length + 1;

			for (const title of titles) {
				const payload = {
					title,
					position
				};
				if (parent) {
					payload.occupation_skill_id = parent.id;
				}

				const response = await Api.post(`/occupations/${occupationId}/occupation_skills`, {
					occupation_skill: payload
				});
				const node = { ...response, skills: [] };

				if (parent) {
					parent.skills = [...parent.skills, node];
				} else {
					clone.push(node);
				}
				position += 1;
			}

			tree = clone;
			pendingTitles = [];
			newTitle = '';
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to add pasted skills';
		} finally {
			confirmingBulk = false;
		}
	}

	function buildTree(flat) {
		const byId = {};
		const roots = [];

		for (const item of flat) {
			byId[item.id] = { ...item, skills: [] };
		}

		for (const item of flat) {
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

	async function load() {
		try {
			loading = true;
			error = '';
			const flat = await Api.get(`/occupations/${occupationId}/occupation_skills`);
			tree = buildTree(flat || []);
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to load occupation skills';
		} finally {
			loading = false;
		}
	}

	const findNode = (root, target) => {
		if (!root || !target) return null;
		if (root.id === target.id) return root;
		for (const child of root.skills || []) {
			const found = findNode(child, target);
			if (found) return found;
		}
		return null;
	};

	const findParentNode = (root, target) => {
		if (!root || !target) return null;
		if (root.id === target.occupation_skill_id) return root;
		for (const child of root.skills || []) {
			const found = findParentNode(child, target);
			if (found) return found;
		}
		return null;
	};

	async function addSkill() {
		if (!newTitle.length) return;

		try {
			error = '';
			const clone = [...tree];
			const virtualRoot = { id: -1, skills: clone };

			if ($selectedOccupationSkill?.id) {
				const node = findNode(virtualRoot, $selectedOccupationSkill);
				const response = await Api.post(`/occupations/${occupationId}/occupation_skills`, {
					occupation_skill: {
						title: newTitle,
						occupation_skill_id: $selectedOccupationSkill.id,
						position: (node?.skills?.length || 0) + 1
					}
				});
				node.skills = [...node.skills, { ...response, skills: [] }];
				tree = clone;
			} else {
				const response = await Api.post(`/occupations/${occupationId}/occupation_skills`, {
					occupation_skill: {
						title: newTitle,
						position: tree.length + 1
					}
				});
				tree = [...tree, { ...response, skills: [] }];
			}
			newTitle = '';
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to add';
		}
	}

	async function move(event) {
		if (!$selectedOccupationSkill) return;
		if (!['w', 'a', 's', 'd'].includes(event.key)) return;

		const active = document.activeElement;
		const tag = active?.tagName;
		if (
			tag === 'INPUT' ||
			tag === 'TEXTAREA' ||
			tag === 'SELECT' ||
			active?.isContentEditable
		) {
			return;
		}
		if (writing) return;

		let clone = [...tree];
		const virtualRoot = { id: -1, skills: clone };
		const parentNode = findParentNode(virtualRoot, $selectedOccupationSkill);
		const grandparentNode = findParentNode(virtualRoot, parentNode);
		const siblings = parentNode ? parentNode.skills : clone;
		// Use live sibling array index — stored `position` can be stale after nest/denest
		const index = siblings.findIndex((s) => s.id == $selectedOccupationSkill.id);
		if (index < 0) return;

		let newIndex = null;
		let element = null;
		let changed = [];

		switch (event.key) {
			case 'w':
				newIndex = index - 1;
				if (parentNode) {
					if (!parentNode.skills[newIndex]) return;
					element = parentNode.skills.splice(index, 1)[0];
					parentNode.skills.splice(newIndex, 0, element);
					changed = [...changed, parentNode];
				} else {
					if (!clone[newIndex]) return;
					element = clone.splice(index, 1)[0];
					clone.splice(newIndex, 0, element);
					changed = [...changed, null];
				}
				break;
			case 's':
				newIndex = index + 1;
				if (parentNode) {
					if (!parentNode.skills[newIndex]) return;
					element = parentNode.skills.splice(index, 1)[0];
					parentNode.skills.splice(newIndex, 0, element);
					changed = [...changed, parentNode];
				} else {
					if (!clone[newIndex]) return;
					element = clone.splice(index, 1)[0];
					clone.splice(newIndex, 0, element);
					changed = [...changed, null];
				}
				break;
			case 'a':
				if (!parentNode) return;
				element = parentNode.skills.splice(index, 1)[0];
				if (grandparentNode) {
					element.occupation_skill_id = grandparentNode.id;
					grandparentNode.skills = [...grandparentNode.skills, element];
					changed = [...changed, grandparentNode];
				} else {
					element.occupation_skill_id = null;
					clone = [...clone, element];
					changed = [...changed, null];
				}
				break;
			case 'd':
				if (!parentNode) {
					element = clone.splice(index, 1)[0];
					if (!clone[index - 1]) return;
					element.occupation_skill_id = clone[index - 1].id;
					clone[index - 1].skills = [...clone[index - 1].skills, element];
					changed = [...changed, null, clone[index - 1]];
				} else {
					element = parentNode.skills.splice(index, 1)[0];
					if (!parentNode.skills[index - 1]) return;
					element.occupation_skill_id = parentNode.skills[index - 1].id;
					parentNode.skills[index - 1].skills = [...parentNode.skills[index - 1].skills, element];
					changed = [...changed, null, parentNode, parentNode.skills[index - 1]];
				}
				break;
			default:
				return;
		}

		await order(clone, changed);
		selectedOccupationSkill.set(element);
	}

	async function remove() {
		if (!$selectedOccupationSkill) return;

		try {
			error = '';
			await Api.delete(`/occupation_skills/${$selectedOccupationSkill.id}`);
			const clone = [...tree];
			const virtualRoot = { id: -1, skills: clone };
			const parentNode = findParentNode(virtualRoot, $selectedOccupationSkill);
			const index = ($selectedOccupationSkill.position || 1) - 1;

			if (parentNode) {
				parentNode.skills.splice(index, 1);
				await order(clone, [parentNode]);
			} else {
				clone.splice(index, 1);
				await order(clone, [null]);
			}
			selectedOccupationSkill.set(null);
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to delete';
		}
	}

	async function order(clone, changed) {
		for (const node of changed) {
			if (node === null) {
				let i = 0;
				for (const el of clone) {
					el.position = i + 1;
					Api.put(`/occupation_skills/${el.id}`, {
						occupation_skill: {
							position: el.position,
							occupation_skill_id: el.occupation_skill_id
						}
					});
					i++;
				}
			} else if (node) {
				let i = 0;
				for (const el of node.skills) {
					el.position = i + 1;
					Api.put(`/occupation_skills/${el.id}`, {
						occupation_skill: {
							position: el.position,
							occupation_skill_id: el.occupation_skill_id
						}
					});
					i++;
				}
			}
		}
		tree = clone;
	}

	onMount(() => {
		load();
		window.addEventListener('keydown', move);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', move);
		selectedOccupationSkill.set(null);
	});
</script>

<section class="mapper">
	<div
		class="sticky"
		class:isStuck
		use:sticky={{ stickToTop: true }}
		on:stuck={handleStuck}
		data-position="top"
	>
		<div class="input-group mb-3">
			<input
				type="text"
				class="form-control"
				placeholder="Add occupation skill (or paste a list)"
				bind:value={newTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
				on:paste={handlePaste}
				on:keydown={(e) => e.key === 'Enter' && !pendingTitles.length && addSkill()}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="input-group-append" on:click={addSkill}>
				{#if $selectedOccupationSkill}
					<div class="btn btn-warning">Nest</div>
				{:else}
					<div class="btn btn-info">Add</div>
				{/if}
			</div>
		</div>

		{#if pendingTitles.length}
			<div class="bulk-preview">
				<div class="pills-scroll">
					{#each pendingTitles as title, i}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<span class="pill" title="Click to remove" on:click={() => removePending(i)}>
							{title}
							<i class="fa fa-times pill-x" />
						</span>
					{/each}
				</div>
				<div class="bulk-actions">
					<button
						type="button"
						class="confirm-btn"
						aria-label="Confirm add"
						disabled={confirmingBulk}
						on:click={confirmPending}
					>
						{#if confirmingBulk}
							…
						{:else}
							<i class="fa fa-check" />
						{/if}
					</button>
					<button type="button" class="cancel-btn" aria-label="Clear preview" on:click={clearPending}>
						<i class="fa fa-times" />
					</button>
				</div>
			</div>
			<p class="bulk-hint">
				{pendingTitles.length} skills ready
				{#if $selectedOccupationSkill}
					· will nest under “{$selectedOccupationSkill.display_title ||
						$selectedOccupationSkill.title}”
				{:else}
					· will add at root
				{/if}
			</p>
		{/if}

		<p class="controls-hint">
			Click a skill to select · W/S reorder · D nest · A un-nest · gear icon for details · paste a list
			for bulk add
		</p>
	</div>

	{#if error}
		<div class="alert alert-danger">{error}</div>
	{/if}

	{#if loading}
		<div class="py-4 text-center">Loading…</div>
	{:else if tree.length === 0}
		<p class="text-muted py-4 text-center">No occupation skills yet. Add one above.</p>
	{:else}
		{#each tree as item}
			<ul class="clean-list">
				<Row {item} {remove} skills={skillsCatalog} />
			</ul>
		{/each}
	{/if}
</section>

<style>
	.mapper {
		background: #fff;
		border-radius: 10px;
		padding: 1rem;
	}

	.sticky {
		position: sticky;
		padding: 1rem;
		background: #fff;
		transition: all 0.3s;
		z-index: 50;
	}

	.sticky[data-position='top'] {
		top: 1rem;
	}

	.controls-hint {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
	}

	.bulk-preview {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 0.5rem;
	}

	.pills-scroll {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 8px 2px 10px;
		flex: 1;
		scrollbar-width: thin;
	}

	.pill {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 999px;
		background: #eef2ff;
		border: 1px solid #c7c7ff;
		color: #2c2c6b;
		font-size: 0.9rem;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
	}

	.pill:hover {
		background: #e0e7ff;
	}

	.pill-x {
		font-size: 0.7rem;
		opacity: 0.55;
	}

	.bulk-actions {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.confirm-btn,
	.cancel-btn {
		width: 40px;
		height: 40px;
		border-radius: 999px;
		border: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1rem;
	}

	.confirm-btn {
		background: #22c55e;
		color: #fff;
	}

	.confirm-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.cancel-btn {
		background: #f1f5f9;
		color: #64748b;
	}

	.bulk-hint {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
		color: #666;
	}

	.clean-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
</style>
