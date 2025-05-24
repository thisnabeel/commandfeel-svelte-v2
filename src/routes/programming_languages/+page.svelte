<script>
	import { goto } from '$app/navigation';

	import Api from '$lib/api/api';
	import { onMount } from 'svelte';
	import SortableList from 'svelte-sortable-list';

	let title = '';
	let editor_slug = '';

	let algos = [];
	async function addAlgo() {
		if (title.length < 1) return;
		if (editor_slug.length < 1) return;
		const response = await Api.post('/programming_languages', {
			title: title,
			editor_slug: editor_slug
		});

		console.log(response);
		algos = [...algos, response];

		title = '';
		editor_slug = '';
	}

	onMount(() => {
		getAlgos();
	});

	async function getAlgos() {
		const response = await Api.get('/programming_languages.json');
		algos = response;
	}

	const sortList = (ev) => {
		algos = ev.detail.map((a, i) => {
			a.position = i + 1;
			return a;
		});
		saveOrder(algos);
	};

	async function saveOrder(list) {
		const response = await Api.post('/programming_languages/order.json', {
			list: algos
		});
		console.log(response);
	}
</script>

<h1>Programming Languages</h1>
<hr />
<input type="text" class="form-control" placeholder="Title" bind:value={title} />
<input type="text" class="form-control" placeholder="Editor Slug" bind:value={editor_slug} />
<div class="btn btn-info" on:click={addAlgo}>Add</div>

<hr />

<SortableList list={algos} key="id" on:sort={sortList} let:item={algo}>
	<li class="algo">
		<span on:click={() => goto('/programming_languages/' + algo.id)}>{algo.title}</span>
	</li>
</SortableList>
<br />
