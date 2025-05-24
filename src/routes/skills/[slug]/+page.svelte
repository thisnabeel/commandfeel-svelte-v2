<script>
	import { onMount, beforeUpdate } from 'svelte';

	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import Api from '$lib/api/api.js';

	import Skill from '$lib/components/Skills/Show.svelte';
	import { mapShown, selectSkill, selectWonder, selectedSkill } from '$lib/stores/main';
	// import { navigating } from '$app/stores';
	import { globalViewCategory } from '$lib/stores/view';

	let skill;
	let changedSlug;

	onMount(async function () {
		globalViewCategory.set('Skills');
		skill = await Api.get('/skills/' + $page.params.slug + '.json');
		console.log('SKILL FIND', skill);
	});

	afterNavigate(async function () {
		fetchSkill($page.params.slug);
		globalViewCategory.set('Skills');
	});

	const fetchSkill = async (slug) => {
		skill = await Api.get('/skills/' + slug + '.json');
		mapShown.set(false);
		selectSkill(skill);
		console.log('gotten', skill);
	};
</script>

{#if skill}
	<Skill {skill} />
{/if}
