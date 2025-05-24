<script>
	import { goto } from '$app/navigation';

	import Api from '$lib/api/api';
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user';
	import SortableList from 'svelte-sortable-list';

	let title = '';

	let traits = [];
	async function addTrait() {
		if (title.length < 1) return;
		const response = await Api.post('/traits', {
			title: title
		});

		console.log(response);
		traits = [...traits, response];

		title = '';
		editor_slug = '';
	}

	onMount(() => {
		getTraits();
	});

	async function getTraits() {
		const response = await Api.get('/traits.json');
		traits = response;
	}

	const sortList = (ev) => {
		traits = ev.detail.map((a, i) => {
			a.position = i + 1;
			return a;
		});
		saveOrder(traits);
	};

	async function saveOrder(list) {
		const response = await Api.post('/traits/order.json', {
			list: traits
		});
		console.log(response);
	}
</script>

<h1>Traits</h1>
<hr />

{#if $user && $user.admin}
	<input type="text" class="form-control" placeholder="Title" bind:value={title} />
	<div class="btn btn-info" on:click={addTrait}>Add</div>
	<hr />
{/if}

{#if $user && $user.admin}
	<SortableList list={traits} key="id" on:sort={sortList} let:item={trait}>
		<li>
			<span on:click={() => goto('/traits/' + trait.id)}>
				{trait.title}
			</span>
		</li>
	</SortableList>
{:else}
	{#each traits as trait}
		<li>
			<span on:click={() => goto('/traits/' + trait.id)}>
				{trait.title}
			</span>
		</li>
	{/each}
{/if}
