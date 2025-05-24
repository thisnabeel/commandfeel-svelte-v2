<script>
	import Item from './Item.svelte';
	export let params;
	export let submit;
	export let inputs;

	function save(payload) {
		submit(payload);
	}
</script>

{#each params as param}
	<Item {param} {inputs} submit={save} />
{/each}

<style>
</style>
