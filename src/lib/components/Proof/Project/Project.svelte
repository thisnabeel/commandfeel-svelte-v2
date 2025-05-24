<script>
	import API from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import Proof from '../Proof.svelte';
	import { skills } from '$lib/stores/main';

	// import ProjectLink from './ProjectLink/ProjectLink.svelte';
	export let project;
	export let removeProject;
	let editable = false;
	let editing = false;

	let addingSkill = false;
	let searchSkills = '';
	let searchResults = [];

	async function selectResult(result) {
		searchResults = [];
		// project.skills = project.skills || [];
		const res = await API.post('/project_skills', {
			user_id: $user.id,
			skill_id: result.id,
			project_id: project.id
		});

		project.skills = [...project.skills, res];
	}

	function search() {
		if (searchSkills.length < 2) {
			searchResults = [];
			return;
		}
		searchResults = $skills.filter((s) =>
			s.title.toLowerCase().includes(searchSkills.toLocaleLowerCase())
		);
		console.log({ searchResults });
	}

	user.subscribe((value) => {
		if (!value) return;
		if (value.id === project.user_id) editable = true;
	});

	async function deleteProject() {
		console.log('delete');
		await API.delete(`/projects/${project.id}.json`);
		removeProject(project.id);
	}
</script>

<li class="project">
	{#if editable}
		<div class="fa fa-cog editable" on:click={() => (editing = !editing)} />
	{/if}

	{#if editable && editing}
		<div class="fa fa-trash delete-project" on:click={deleteProject} />
	{/if}
	<div>
		<h1 style="text-align:left; display:inline;">
			{project.title}
		</h1>
		<div class="description">
			{@html project.description}
		</div>
	</div>

	{#if editable}
		<div class="skill-tabs">
			{#if !addingSkill}
				<div class="btn btn-outline-primary" on:click={() => (addingSkill = !addingSkill)}>
					Add Skill <i class="fa fa-plus" />
				</div>
			{:else}
				<div class="btn btn-warning" on:click={() => (addingSkill = !addingSkill)}>
					Cancel <i class="fa fa-times" />
				</div>
				<div>
					<input
						type="text"
						placeholder="Search Skill..."
						bind:value={searchSkills}
						class="form-control"
						on:keyup={search}
					/>
					{#if searchResults.length > 0}
						<ul class="search-results clean-list">
							{#each searchResults as result}
								<li on:click={() => selectResult(result)}>{result.title}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<br />
	<ul class="clean-list">
		<!-- <li class="skill" style="background: transparent;">Main</li> -->
		{#each project.skills as skill}
			<li class="skill">{skill.title}</li>
		{/each}
	</ul>

	{#if project.proof}
		<Proof proof={project.proof} irremovable={true} />
	{/if}
</li>

<style>
	.skill {
		padding: 4px;
		border: 1px solid #ccc;
		margin: 0 2px;
	}
	.search-results {
		position: absolute;
		z-index: 999;
		background: #fff;
		padding: 10px;
		border: 2px solid #000;
	}

	.search-results li {
		border-bottom: 1px solid #ccc;
		padding: 4px;
	}

	.search-results li:hover {
		background-color: #f5f8ff;
	}

	.skill-tabs > * {
		display: inline-block;
	}
	.description {
		color: #89600d;
	}
	.skill {
		display: inline-block;
		padding: 8px 14px;
		background: #ffeaff;
		border-radius: 8px;
	}
	.project_links {
		margin-top: 10px;
	}
	.project {
		/* margin-top: 8px;
		background: #fbfcf9;
		padding: 2em 2em 0 2em;
		position: relative; */

		margin-top: 8px;
		background: #fbfcf9;
		padding: 2em 2em 0 2em;
		padding-bottom: 2.2em;
		position: relative;
		box-shadow: -1px 4px 5px 3px #f2f1f1;
		border-radius: 10px;
	}

	.more {
		padding: 1em 0;
	}

	.project .head {
		font-size: 24px;
		/* background: #f2f2ff; */
	}

	.editable {
		position: absolute;
		top: 10px;
		right: 10px;
		font-size: 24px;
	}

	.delete-project {
		position: absolute;
		top: 10px;
		right: 40px;
	}
</style>
