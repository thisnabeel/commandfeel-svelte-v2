<script>
	import QuestPlay from '$lib/components/Quests/Play/Play.svelte';
	import { layoutClass } from '$lib/stores/view';
	import { onMount, onDestroy } from 'svelte';

	onMount(() => {
		layoutClass.set('questView');
	});

	onDestroy(() => {
		layoutClass.set('defaultView');
	});
</script>

<QuestPlay />
