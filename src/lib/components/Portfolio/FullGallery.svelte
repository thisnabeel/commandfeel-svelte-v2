<script>
	export let proofs;
	export let projects;
	export let removeProof;
	export let removeProject;
	import Proof from '$lib/components/Proof/Proof.svelte';
	import Project from '$lib/components/Proof/Project/Project.svelte';

	$: skills = proofs.map((item) => item.challenge?.challengeable?.title);
</script>

<div class="proofs clean-list">
	{#each proofs as proof}
		<Proof {proof} {removeProof} />
	{/each}

	{#each projects as project}
		<Project {project} {removeProject} />
	{/each}
</div>

<style>
</style>
