<script>
	import Abstractions from '$lib/components/Skills/Tabs/Abstractions/Abstractions.svelte';
	import { user } from '$lib/stores/user';
	export let skill;
	export let removeSkill;
</script>

<li class="skill">
	<div class="head">
		{skill.title}
	</div>
	<div class="abstractions">
		<Abstractions {skill} user={$user} />
	</div>
</li>

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
