<script>
	export let algorithm;
	import { goto } from '$app/navigation';
	export let move;
	export let index;

	import { user } from '$lib/stores/user';
	import { showGuide } from '$lib/stores/view';
</script>

<li class="algo" on:click={() => goto('/algorithms/' + algorithm.id)}>
	<span>
		<!-- <span class="difficulty difficulty-1">Easy</span> -->
		<span class="title"
			>{algorithm.title}

			{#if index === 0 && $showGuide}
				<div class="guide algo-guide">Click Here to Take Challenge</div>
			{/if}
		</span>
	</span>
</li>

<style>
	.guide.algo-guide {
		display: inline-block;
		margin: 0;
	}
	.difficulty {
		background-color: rgb(255, 255, 255);
		padding: 4px 10px;
		border-radius: 10px;
	}

	.algo {
		list-style: none;
		font-size: 24px;
		border-bottom: 1px solid #ccc;
		padding-top: 8px;
		padding-bottom: 8px;
		cursor: pointer;
	}

	.algo:hover {
		background: #1be8f1;
	}
</style>
