<script>
	import { page } from '$app/stores';
	import API from '$lib/api/api';
	import Challenge from '$lib/components/Skills/Tabs/Challenges/Challenge.svelte';
	import { onMount } from 'svelte';

	let challenges = [];
	let language;
	const addChallenge = async () => {
		const response = await API.post('/challenges.json', {
			challengeable_id: $page.params.id,
			challengeable_type: 'ProgrammingLanguage'
		});

		challenges = [...challenges, response];
	};

	const destroy = async (id) => {
		const response = await API.delete('/challenges/' + id + '.json');
		challenges = challenges.filter((q) => q.id !== id);
	};

	const getChallenges = async () => {
		const res = await API.get(
			'/programming_languages/' + $page.params.id + '?challenges=true.json'
		);
		language = res;

		challenges = language.challenges;
	};

	onMount(() => {
		getChallenges();
	});

	const refresh = () => {};
</script>

<h1>Challenges:</h1>

<div class="btn btn-info" on:click={addChallenge}><i class="fa fa-plus" /></div>

{#if challenges}
	{#each challenges as challenge}
		<Challenge {language} {challenge} {destroy} {refresh} codable={true} editable={true} />
	{/each}
{/if}

<style></style>
