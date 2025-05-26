<script>
	export let wonder;
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';

	import Challenge from './Challenge.svelte';

	const addChallenge = async () => {
		const response = await Api.post('/challenges.json', {
			challengeable_id: wonder.id,
			challengeable_type: 'Wonder'
		});

		wonder.challenges = [...wonder.challenges, response];
	};

	const destroy = async (id) => {
		const response = await Api.delete('/challenges/' + id + '.json');
		wonder.challenges = wonder.challenges.filter((q) => q.id !== id);
	};

	const generateChallenge = async () => {
		const response = await Api.post('/wonders/generate_challenge.json', {
			id: wonder.id
		});

		wonder.challenges = [...wonder.challenges, response];
	};
</script>

<div class="challenges">
	{#if $user && $user.admin}
		<div class="adder">
			<div class="add-challenge" on:click={addChallenge}>+</div>
			<div class="btn btn-warning generate-challenge" on:click={generateChallenge}>
				<i class="fa fa-bolt" />
			</div>
		</div>
	{/if}
	{#each wonder.challenges || [] as challenge}
		<Challenge {challenge} {wonder} {destroy} />
	{/each}
</div>

<style>
	.adder {
		font-size: 72px;
		position: absolute;
		left: 35%;
		/* display: inline; */
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
		display: -webkit-inline-box;
	}

	.challenges {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		width: 70%;
		margin: 0 auto;
		padding: 20px 0;
	}

	@media (max-width: 480px) {
		.challenges {
			width: 100%;
		}
	}
</style>
