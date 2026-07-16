<script>
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api';
	import HistoryItem from './HistoryItem.svelte';

	export let element;

	if (!element.skill_histories) {
		element.skill_histories = [];
	}

	async function handleRemove(payload) {
		await Api.delete('/skill_histories/' + payload.id + '.json');
		element.skill_histories = element.skill_histories.filter((h) => h.id !== payload.id);
	}

	const addHistory = async () => {
		const response = await Api.post(`/skills/${element.id}/skill_histories.json`, {
			body: '<p></p>'
		});
		element.skill_histories = [response, ...element.skill_histories];
	};

	const generateHistory = async () => {
		const response = await Api.post('/skills/generate_history', {
			id: element.id
		});
		element.skill_histories = [response, ...element.skill_histories];
	};

	let requested = false;
</script>

<div class="histories">
	{#if $user && $user.admin}
		<div class="adder">
			<button type="button" class="add-history" on:click={addHistory}>+</button>
			<button type="button" class="btn btn-warning generate-history" on:click={generateHistory}>
				<i class="fa fa-bolt" />
			</button>
		</div>
	{/if}

	{#if element.skill_histories?.length > 0}
		{#each element.skill_histories as history (history.id)}
			<HistoryItem {history} user={$user} removeHistory={handleRemove} />
		{/each}
	{:else}
		<div class="cta">
			<h1>No History Yet.</h1>
			<br />
			{#if !requested}
				<button type="button" class="btn btn-warning" on:click={() => (requested = true)}>
					Request History
				</button>
			{:else}
				<div class="requested">
					Thank You for requesting.<br /> Our team will add the history of this concept soon.
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.cta {
		background: rgb(207, 41, 41);
		color: #fff;
		display: block;
		padding: 3em;
		border-radius: 8px;
	}

	.cta .btn {
		display: block;
		font-size: 22px;
	}

	.cta h1 {
		color: #fff;
	}

	.adder {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.add-history {
		border: none;
		background: transparent;
		font-size: 2.5rem;
		line-height: 1;
		color: #0f172a;
		cursor: pointer;
		padding: 0 0.35rem;
	}

	.histories {
		position: relative;
		width: min(720px, 92%);
		margin: 0 auto;
		padding: 1.25rem 0 2rem;
		text-align: left;
	}
</style>
