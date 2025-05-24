<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { curry } from 'ramda';
	import {
		mapShown,
		selectSkill,
		selectWonder,
		selectedSkill,
		selectedFeel
	} from '$lib/stores/main';

	import Fa from 'svelte-fa';
	import { faCaretSquareRight } from '@fortawesome/free-solid-svg-icons';
	import { goto } from '$app/navigation';

	let select;
	let gold = null;

	export let item;
	export let type;

	if (type === 'skill') select = selectSkill;
	if (type === 'trait') select = selectWonder;

	const handleSkillClick = async (id) => {
		const endpoint = '/' + type + 's/' + item.slug;
		const response = await Api.get(endpoint + '.json');
		goto(endpoint);
	};

	const handleTraitClick = (id) => {
		const endpoint = '/' + type + 's/' + item.id;
		goto(endpoint);
	};

	function hasChildren(item) {
		return item.wonders.length > 0;
	}

	const Tree = {
		reduce: curry(function reduce(reducerFn, init, node) {
			const acc = reducerFn(init, node);
			if (acc > 0) {
				return acc;
			}
			if (!hasChildren(node)) {
				return acc;
			}
			return node.wonders.reduce(Tree.reduce(reducerFn), acc);
		})
	};

	function sumGold(total, item) {
		return total + item.wonder_items.length;
	}

	const checkGold = (item) => {
		gold = Boolean(Tree.reduce(sumGold, 0, item));
	};

	// $: console.log("origFeel", item.feel )
	// $: console.log("skillFeel", $selectedFeel )
	$: console.log($selectedFeel + ':' + item.feel, item.feel === $selectedFeel);
</script>

{#if type === 'skill'}
	<li class="skill">
		<span on:click|once={handleSkillClick(item.id)}>{item.title}</span>

		{#each item.skills as skill}
			<svelte:self item={skill} type="skill" />
		{/each}
	</li>
{/if}

{#if type === 'trait'}
	<li class="trait" on:click={() => handleTraitClick(item.id)}>
		<span>{item.title}</span>
	</li>
{/if}

{#if type === 'wonder'}
	<li class="wonder" abstra-count={item.wonder_items.length} worthy={gold}>
		<span on:click|once={handleSkillClick(item.id)}>
			{item.title}

			{#if gold && item.wonders.length > 0}
				<Fa icon={faCaretSquareRight} />
			{/if}
		</span>
		{#each item.wonders as wonder}
			<svelte:self item={wonder} type="wonder" />
		{/each}
	</li>
{/if}

<style>
	li {
		margin-left: 10px;
		border-left: 6px solid #ffeaa7;
		font-size: 18px;
		/* border-bottom: 6px solid #f9ecc2; */
		margin-bottom: 0;
		padding-left: 12px;
		cursor: pointer;
	}

	li:hover {
		border-left: 6px #416fff solid;
	}

	.skill[abstra-count='0'] {
		color: #ccc;
	}

	.wonder[worthy='false'] > span {
		display: none;
	}
</style>
