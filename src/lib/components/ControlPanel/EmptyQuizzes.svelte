<script>
	import API from '$lib/api/api';
	import Quiz from '$lib/components/Skills/Tabs/Quiz/Quiz.svelte';
	import { onMount } from 'svelte';

	let quizzes = [];
	onMount(async () => {
		quizzes = await API.get('/control_panel/empty_quizzes.json');
		console.log({ quizzes });
	});
</script>

<div class="wrapper">
	{#each quizzes as quiz}
		<Quiz {quiz} editable={true} />
	{/each}
</div>

<style>
</style>
