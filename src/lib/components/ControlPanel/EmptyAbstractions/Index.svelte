<script>
	import API from '$lib/api/api';

	import { onMount } from 'svelte';
	import Skill from './Skill.svelte';

	let skills = [];
	onMount(async () => {
		skills = await API.get('/control_panel/empty_abstractions.json');
		console.log({ skills });
	});

	function removeSkill() {}
</script>

<div class="wrapper">
	<ul class="clean-list skills">
		{#each skills as skill}
			<Skill {skill} {removeSkill} />
		{/each}
	</ul>
</div>

<style>
	.skill {
		padding: 10px;
		margin: 10px;
		background: #fff;
	}

	.head {
		font-size: 32px;
	}
</style>
