<script>
	export let aspect;
	let showBody = false;
</script>

<div class="aspect-container">
	<div class="aspect-title" on:click={() => (showBody = !showBody)}>{aspect.title}</div>
	{#if showBody}
		<div class="contenders flex">
			{#each aspect.contenders as contender}
				<div>
					<div class="title">
						{contender.trade_off_contender.title}
					</div>
					<div class="body">
						{contender.body}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.aspect-container {
		/* margin: 20px 0; */
		background-color: rgb(230, 230, 230);
		border-radius: 10px;
		overflow: hidden;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}

	.aspect-title {
		background-color: rgb(212 47 47);
		color: #fff;
		border-radius: 10px 10px 0 0;
		padding: 12px;
		text-align: center;
		font-size: 18px;
		font-weight: bold;
	}

	.title {
		font-weight: bold;
	}

	.contenders {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-evenly;
		padding: 20px;
	}

	.contenders .body {
		flex: 1 1 45%;
		margin: 10px;
		padding: 15px;
		background-color: #fff;
		border-radius: 8px;
		box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.vs {
		font-size: 14px;
		color: #555;
		margin: 0 8px;
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

		.contenders > div {
			flex: 1 1 100%;
		}
	}
</style>
