<script>
	import { goto } from '$app/navigation';

	export let language;
	export let link = false;

	let open = false;
</script>

<li class="language" class:open>
	<span
		class="head"
		on:click={() => {
			if (link) {
				goto(`/programming_languages/${language.id}`);
			} else {
				open = !open;
			}
		}}>{language.title}</span
	>

	{#if open}
		<slot />
	{/if}
</li>

<style>
	.language .head {
		padding: 22px;
		font-size: 32px;
		display: block;

		cursor: pointer;
	}

	.language .head:hover {
		background: #b6ddff;
	}

	.language.open .head {
		background: #000;
		color: #fff;
	}
	.language {
		margin: 10px 0;
		border: 4px solid rgb(22, 22, 22);
	}
</style>
