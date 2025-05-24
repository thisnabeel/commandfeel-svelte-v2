<script>
	import EmptyAbstractions from './EmptyAbstractions/Index.svelte';
	import EmptyQuizzes from './EmptyQuizzes.svelte';
	let page = 1;
</script>

<div class="jumbotron">
	<h1>Control Panel:</h1>
</div>
<div class="flex">
	<div class:active={page === 1} on:click={() => (page = 1)}>Empty Quizzes</div>
	<div class:active={page === 2} on:click={() => (page = 2)}>No Abstractions</div>
</div>

{#if page === 1}
	<EmptyQuizzes />
{/if}

{#if page === 2}
	<EmptyAbstractions />
{/if}

<style>
	.jumbotron {
		background-color: rgb(235, 235, 235);
		padding: 24px;
	}

	.flex {
		display: flex;
	}

	.flex > div {
		flex: 1 1 50%;
		padding: 2em;
		text-align: center;
	}

	.active {
		background: #000;
		color: #fff;
	}
</style>
