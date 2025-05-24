<script>
	export let proofs;
	export let projects;
	import Proof from '$lib/components/Proof/Proof.svelte';
	import Project from '$lib/components/Proof/Project/Project.svelte';

	let selectedSkill = null;
	let searchInput = '';
	let filteredSkills = [];

	// $: skills = proofs.map((item) => item.challenge?.challengeable?.title);
	$: skills = Array.from(
		new Set(
			proofs
				.map((item) => item.challenge?.challengeable?.title)
				.concat(projects.flatMap((project) => project.skills.map((skill) => skill.title)))
		)
	);

	// Filter selected proofs based on the selected skill
	$: selectedProofs = proofs.filter((p) => p.challenge?.challengeable?.title === selectedSkill);

	// Find projects that have the selected skill
	$: selectedProjects = projects.filter((project) =>
		project.skills.some((skill) => skill.title === selectedSkill)
	);

	$: filteredSkills = skills
		.filter((s) => s.toLowerCase().includes(searchInput.toLowerCase()))
		.sort((a, b) => a.localeCompare(b));
</script>

<h3 class="text-center has-ability">knows:</h3>
<input
	type="text"
	class="form-control search-abilities"
	bind:value={searchInput}
	placeholder="Search..."
/>

<ul class="by-skills-list clean-list">
	{#each filteredSkills || [] as skill}
		<li style="display: block;">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<span
				class:selectedSkill={selectedSkill === skill}
				class="rendered_skill_description"
				on:click={() => {
					if (selectedSkill) {
						if (selectedSkill === skill) {
							selectedSkill = null;
							return;
						} else {
							selectedSkill = skill;
							return;
						}
					}
					selectedSkill = skill;
				}}
			>
				<span class="skill-title">
					{skill}
					<i class="fa fa-expand expand" />
				</span>
			</span>
			{#if selectedSkill === skill}
				<section class="dp_box">
					{#each selectedProofs as proof}
						<Proof {proof} />
					{/each}

					{#each selectedProjects as project}
						<Project {project} />
					{/each}
				</section>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.expand {
		position: absolute;
		right: 10px;
		top: 4px;
		color: #ccccccbf;
	}
	.dp_box {
		border-top: 3px solid #000;
		padding: 12px;
		margin-top: -3px;
		border-radius: 12px;
	}
	.selectedSkill {
		background-color: #000;
		color: #fff !important;
		max-width: 100%;
		/* text-align: center; */
		font-size: 40px !important;
	}

	.has-ability {
		color: #768fd9;
	}
	.search-abilities {
		max-width: 30vw;
		margin: 0 auto;
		margin-bottom: 10px;
	}

	.by-skills-list .rendered_skill_description {
		display: block;
		padding: 11px;
		border: 1px solid #e2e2e2;
		max-width: 30vw;
		margin: 0 auto;
	}

	.by-skills-list .rendered_skill_description.selectedSkill {
		display: block;
		padding: 11px;
		border: 1px solid #e2e2e2;
		max-width: 100vw;
		text-align: center;
		border-radius: 10px;
		margin: 0 auto;
		position: sticky;
		top: 0;
		z-index: 999;
	}

	.selectedSkill .expand {
		display: none;
	}

	.by-skills-list .rendered_skill_description:hover {
		border: 1px solid #000;
	}

	.skill-title {
		position: relative;
		display: block;
		width: 100%;
	}

	.rendered_skill_description {
		display: block;

		color: #7e31d1;
		padding: 0px;
		font-size: 20px;
	}

	@media (max-width: 480px) {
		.by-skills-list li,
		.search-abilities {
			max-width: 100%;
		}

		.rendered_skill_description {
			max-width: 100% !important;
		}
	}
</style>
