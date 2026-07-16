<script>
	import { selectedOccupationSkill } from '$lib/stores/occupations/mapper';
	import Api from '$lib/api/api';

	export let item;
	export let remove;
	export let skills = [];

	let showSettings = false;
	let saving = false;
	let error = '';
	let collapsed = false;

	let editForm = {
		title: '',
		skill_id: '',
		description: '',
		video_url: ''
	};

	let skillQuery = '';
	let skillResults = [];
	let showSkillResults = false;
	let hoveringSkillResults = false;

	function handleClick() {
		if ($selectedOccupationSkill && $selectedOccupationSkill.id === item.id) {
			selectedOccupationSkill.set(null);
			showSettings = false;
		} else {
			selectedOccupationSkill.set(item);
			editForm = {
				title: item.title || '',
				skill_id: item.skill_id || '',
				description: item.description || '',
				video_url: item.video_url || ''
			};
			skillQuery = item.skill_title || '';
			skillResults = [];
			showSkillResults = false;
		}
	}

	function toggleCollapse(e) {
		e.stopPropagation();
		collapsed = !collapsed;
	}

	function searchSkills() {
		if (skillQuery.trim().length < 2) {
			skillResults = [];
			showSkillResults = false;
			return;
		}
		const q = skillQuery.toLowerCase();
		skillResults = skills
			.filter((s) => s.title?.toLowerCase().includes(q))
			.slice(0, 12);
		showSkillResults = true;
	}

	function selectLinkedSkill(skill) {
		editForm.skill_id = skill.id;
		skillQuery = skill.title;
		showSkillResults = false;
		skillResults = [];
	}

	function clearLinkedSkill() {
		editForm.skill_id = '';
		skillQuery = '';
		skillResults = [];
		showSkillResults = false;
	}

	function hideSkillResultsSoon() {
		setTimeout(() => {
			if (!hoveringSkillResults) showSkillResults = false;
		}, 120);
	}

	async function saveSettings() {
		try {
			saving = true;
			error = '';
			const updated = await Api.put(`/occupation_skills/${item.id}`, {
				occupation_skill: {
					title: editForm.title || null,
					skill_id: editForm.skill_id ? Number(editForm.skill_id) : null,
					description: editForm.description || null,
					video_url: editForm.video_url || null
				}
			});
			item.skill_id = updated.skill_id;
			item.skill_title =
				updated.skill_title ||
				skills.find((s) => s.id == updated.skill_id)?.title ||
				null;
			item.title = updated.title;
			item.description = updated.description;
			item.video_url = updated.video_url;
			item.display_title = updated.display_title || item.title || item.skill_title;
			selectedOccupationSkill.set({ ...item });
			showSettings = false;
		} catch (err) {
			error = err?.response?.data?.error || err?.message || 'Failed to save';
		} finally {
			saving = false;
		}
	}

	$: label = item.display_title || item.title || item.skill_title || `Skill #${item.id}`;
	$: hasChildren = (item.skills || []).length > 0;
	$: selectedSkillTitle =
		skills.find((s) => s.id == editForm.skill_id)?.title || item.skill_title || '';
	$: isLinked = !!(item.skill_id || (showSettings && editForm.skill_id));
	$: linkedTitle =
		(showSettings && selectedSkillTitle) || item.skill_title || selectedSkillTitle || 'Linked skill';
</script>

<li
	class="skill"
	class:selected={$selectedOccupationSkill && item.id === $selectedOccupationSkill.id}
	class:collapsed
>
	<div class="row-head">
		{#if hasChildren}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<button
				type="button"
				class="caret"
				aria-label={collapsed ? 'Expand' : 'Collapse'}
				aria-expanded={!collapsed}
				on:click={toggleCollapse}
			>
				<i class="fa" class:fa-caret-right={collapsed} class:fa-caret-down={!collapsed} />
			</button>
		{:else}
			<span class="caret-spacer" />
		{/if}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<span class="title" on:click={handleClick}>
			{label}
			{#if isLinked}
				<span class="uni-badge" title="Linked to platform skill: {linkedTitle}">
					<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
						<path
							fill="currentColor"
							d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
						/>
					</svg>
				</span>
			{/if}
		</span>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<i class="fa fa-cog settings-btn" on:click={() => (showSettings = !showSettings)} />
	</div>

	{#if showSettings && $selectedOccupationSkill && item.id === $selectedOccupationSkill.id}
		<div class="settings">
			{#if error}
				<div class="alert alert-danger">{error}</div>
			{/if}
			<label>
				Title
				<input type="text" bind:value={editForm.title} placeholder="Shown when no skill is linked" />
			</label>
			<label class="skill-link">
				Linked Skill (optional)
				<div class="skill-search">
					<input
						type="text"
						placeholder="Search skills..."
						bind:value={skillQuery}
						on:keyup={searchSkills}
						on:input={searchSkills}
						on:focus={() => {
							if (skillQuery.length >= 2) searchSkills();
						}}
						on:blur={hideSkillResultsSoon}
					/>
					{#if editForm.skill_id}
						<button type="button" class="clear-link" on:click={clearLinkedSkill}>Clear</button>
					{/if}
					{#if showSkillResults && skillResults.length > 0}
						<ul
							class="skill-results"
							on:mouseenter={() => (hoveringSkillResults = true)}
							on:mouseleave={() => {
								hoveringSkillResults = false;
								showSkillResults = false;
							}}
						>
							{#each skillResults as result}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<li on:mousedown|preventDefault={() => selectLinkedSkill(result)}>
									{result.title}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				{#if editForm.skill_id}
					<span class="linked-pill">
						<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
							<path
								fill="currentColor"
								d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
							/>
						</svg>
						{selectedSkillTitle || 'Linked skill'}
					</span>
				{/if}
			</label>
			<label>
				Description
				<textarea bind:value={editForm.description} />
			</label>
			<label>
				Video URL
				<input type="url" bind:value={editForm.video_url} />
			</label>
			<div class="actions">
				<button class="btn btn-success btn-sm" type="button" disabled={saving} on:click={saveSettings}>
					Save
				</button>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="btn btn-danger btn-sm" on:click={() => remove(item)}>
					<i class="fa fa-trash" />
				</div>
			</div>
			<p class="hint">WASD: W/S reorder · D nest under previous · A un-nest</p>
		</div>
	{/if}

	{#if hasChildren && !collapsed}
		{#each item.skills as child}
			<svelte:self item={child} {remove} {skills} />
		{/each}
	{/if}
</li>

<style>
	.settings {
		padding: 20px;
		background: aliceblue;
		border: 2px solid #c7c7ff;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.settings label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.9rem;
	}

	.settings input,
	.settings textarea {
		padding: 6px 8px;
		border: 1px solid #ced4da;
		border-radius: 4px;
	}

	.skill-search {
		position: relative;
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.skill-search input {
		flex: 1;
	}

	.clear-link {
		border: 1px solid #ced4da;
		background: #fff;
		border-radius: 4px;
		padding: 6px 10px;
		font-size: 0.8rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.skill-results {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 20;
		margin: 0;
		padding: 0;
		list-style: none;
		max-height: 220px;
		overflow-y: auto;
		background: #fff;
		border: 1px solid #c7c7ff;
		border-radius: 6px;
		box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
	}

	.skill-results li {
		padding: 8px 12px;
		cursor: pointer;
	}

	.skill-results li:hover {
		background: #eef2ff;
	}

	.linked-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.4rem;
		align-self: flex-start;
		padding: 0.35rem 0.85rem;
		border-radius: 999px;
		background: #0f766e;
		color: #fff;
		font-weight: 700;
		font-size: 0.85rem;
		letter-spacing: 0.01em;
	}

	.linked-pill .fa-link {
		font-size: 0.75rem;
		opacity: 0.9;
	}

	.actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
	}

	.settings-btn {
		display: none;
		color: #ccc;
		cursor: pointer;
		font-size: 22px;
		padding: 0 8px;
	}

	.selected > .row-head .settings-btn {
		display: inline;
	}

	.skill {
		position: relative;
	}

	.row-head {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.caret {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		background: transparent;
		color: #555;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		line-height: 1;
	}

	.caret:hover {
		color: #111;
	}

	.caret-spacer {
		flex-shrink: 0;
		width: 28px;
	}

	.title {
		flex: 1;
		padding: 14px 14px 14px 4px;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.55rem;
		font-size: 24px;
		cursor: pointer;
	}

	.uni-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.65rem;
		height: 1.65rem;
		border-radius: 999px;
		background: #0f766e;
		color: #fff;
		font-size: 0.8rem;
		flex-shrink: 0;
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
	}

	.selected > .row-head .title {
		background: rgb(199, 199, 255);
	}

	.skill :global(.skill) {
		margin-left: 24px;
		border-left: 1px solid #ccc;
	}
</style>
