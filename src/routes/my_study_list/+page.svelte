<script>
	import { afterNavigate } from '$app/navigation';
	import MyStudyList from '$lib/components/MyStudyList/Index.svelte';
	import { globalViewCategory } from '$lib/stores/view';
	import { currentPage } from '$lib/stores/view';

	afterNavigate(() => {
		globalViewCategory.set('Skills');
		currentPage.set('myStudyList');
	});
</script>

<MyStudyList />

<style></style>
