<script>
	import { afterNavigate } from '$app/navigation';
	import Algorithms from '$lib/components/Algorithms/Index.svelte';
	import { globalViewCategory } from '$lib/stores/view';
	afterNavigate(() => {
		globalViewCategory.set('Languages');
	});
</script>

<Algorithms />
