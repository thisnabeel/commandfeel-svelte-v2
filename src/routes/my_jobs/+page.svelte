<script>
	import { afterNavigate } from '$app/navigation';
	import MyJobs from '$lib/components/Jobs/MyJobs/Index.svelte';
	import { currentPage } from '$lib/stores/view';

	afterNavigate(() => {
		currentPage.set('myJobs');
	});
</script>

<MyJobs />

<style>
</style>
