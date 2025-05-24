<script>
	export let activeTestCase;
	export let select;
	export let test_case;
	export let index;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="btn btn-lg tab" on:click={select}>
	Case {index}
</div>

<style>
	.spinner {
		max-width: 25px;
		right: -10px;
		position: relative;
	}
	.wrong {
		background: red;
		color: #fff;
	}

	.correct {
		background: #00ff43;
		color: #000;
	}

	.purple {
		background-color: purple;
	}

	.tab {
		padding-bottom: 8px !important;
		display: inline-block;
	}

	.tab:hover {
		border-bottom: 6px solid rgb(163, 163, 255);
		padding-bottom: 2px !important;
	}

	.activeTab {
		border-color: blue;
	}
</style>
