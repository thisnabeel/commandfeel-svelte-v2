<script>
	import { afterNavigate } from '$app/navigation';
	import API from '$lib/api/api';
	import { onMount } from 'svelte';

	import ListItem from './ListItem.svelte';

	import SearchSkills from '../Tester/SearchSkills.svelte';
	import { user } from '$lib/stores/user';
	let tradeoffs;

	afterNavigate(() => {
		getTradeoffs();
	});

	async function getTradeoffs() {
		tradeoffs = await API.get('/trade_offs.json');
		console.log({ tradeoffs });
	}

	let topics = [];

	function saveTopics(payload) {
		// console.log({ payload });
		topics = payload;
	}

	async function makeTradeoff() {
		console.log({ topics });
		const res = await API.post('/trade_offs/make', {
			topics: topics
		});
		console.log({ res });
		tradeoffs = [...tradeoffs, res];
		topics = [];
	}
</script>

<h1>Tradeoffs</h1>

{#if $user && $user.admin}
	<SearchSkills showInput={true} {topics} {saveTopics} />
	<!-- svelte-ignore empty-block -->
	{#if topics}
		<div class="btn btn-primary btn-block" on:click={makeTradeoff}>Make TradeOff</div>
	{/if}
{/if}

<ul class="clean-list">
	{#each tradeoffs || [] as tradeoff}
		<ListItem {tradeoff} />
	{/each}
</ul>

<style>
</style>
