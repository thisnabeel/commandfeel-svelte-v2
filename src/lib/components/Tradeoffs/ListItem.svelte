<script>
	import API from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import Aspect from './Aspect.svelte';
	export let tradeoff;
	$: titles = tradeoff.title.split(' vs. ');
	let showBody = false;

	async function chatgpt() {
		const prompt = `make a table for trade-offs between ${titles.join(' & ')} .
return json in this format [{aspect: string, contenders: {contender1: text, contender2: text, ...}}, ...]`;
		const res = await API.post('/trade_offs/prompt', {
			prompt: prompt,
			id: tradeoff.id
		});

		console.log({ res });
		tradeoff = res;
	}

	function toggleExpand() {
		if (!showBody) {
			if (!tradeoff.trade_off_aspects) {
				getAspects();
			}
		} else {
			showBody = false;
		}
	}

	async function getAspects() {
		tradeoff = await API.get('/trade_offs/' + tradeoff.id + '.json');
		showBody = true;
	}
</script>

<li class="tradeoff">
	<div class="head flex" on:click={toggleExpand}>
		{#each titles as title, index}
			<div>
				<span>
					{title}
				</span>
				{#if index < titles.length - 1}
					<!-- <span class="vs">vs.</span> -->
				{/if}
			</div>
		{/each}

		{#if $user && $user.admin}
			<i class="fa fa-bolt generate" on:click={chatgpt} />
		{/if}
	</div>

	{#if showBody}
		{#each tradeoff.trade_off_aspects as aspect}
			<Aspect {aspect} />
		{/each}
	{/if}
</li>

<style>
	.head {
		position: sticky;
		top: 0;
		/* background-color: #fff; */
		background-color: #f6ff89;
		padding: 1em;
		z-index: 99;
		display: flex;
		justify-content: space-evenly;
		align-items: center;
		border-bottom: 1px solid #ddd;
	}

	.head span {
		font-size: 20px;
		font-weight: bold;
	}

	.vs {
		font-size: 14px;
		color: #555;
		margin: 0 8px;
	}

	.generate {
		position: absolute;
		right: -24px;
	}

	@media only screen and (max-width: 600px) {
		.head {
			flex-direction: column;
		}

		.head span {
			font-size: 16px;
		}

		.vs {
			font-size: 12px;
			margin: 0;
		}
	}
</style>
