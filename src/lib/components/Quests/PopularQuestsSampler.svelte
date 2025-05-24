<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';

	let quests = [];

	onMount(async () => {
		const response = await Api.get('/quests/popular');
		console.log('popular quests', response);
		quests = response;
	});
</script>

{#if quests.length > 0}
	<div class="masonry-container">
		{#each quests as item}
			<div class="box">
				<a class="clean-a" target="_blank" href="/quests/{item.id}/play">
					<img
						class="cover"
						src={item.cover || item.steps.find((s) => s.image_url)?.image_url}
						alt="cover image"
					/>
					<span class="objective">
						<span class="english">{item.title}</span>
					</span>
					<span class="in-lang">
						<i class="fa fa-compass" aria-hidden="true" />
						{item.skill.title}
					</span>
				</a>
				{#if $user && $user.admin}
					<a href="/quests/{item.id}/edit" class="btn btn-block btn-warning">Edit</a>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.cover {
		width: 100%;
		border-radius: 10px 10px 0 0;
		object-fit: cover;
		max-height: 200px;
	}

	.objective {
		background: #ffd1bc;
		display: block;
		font-size: 24px;
		border-radius: 0;
		font-family: 'GreycliffCF-Regular';
	}

	.english {
		padding: 20px;
		display: block;
		font-weight: bold;
	}

	.in-lang {
		background: linear-gradient(to right, #de208826, #007bfe00);
		box-shadow: 1px 0px 20px 3px rgb(46 244 154 / 23%);
		padding: 8px 0px;
		font-size: 20px;
		text-align: center;
		display: block;
	}

	.masonry-container {
		-webkit-columns: 2 200px;
		-moz-columns: 2 200px;
		columns: 3 200px;
		-webkit-column-gap: 1.5rem;
		-moz-column-gap: 1.5rem;
		column-gap: 0.5rem;
		width: 100%;
		margin: 0 auto;
	}

	.box {
		width: 100%;
		margin: 0 1.5rem 1.5rem 0;
		display: inline-block;
		border: solid 2px transparent;
		border-radius: 10px 10px 0 0;
		transition: all 0.25s ease-in-out;
		background: white;
	}

	.clean-a {
		text-decoration: none;
		color: inherit;
	}

	.btn-block {
		display: block;
		width: 100%;
	}

	.btn-warning {
		color: #000;
		background-color: #ffc107;
		border-color: #ffc107;
	}
</style>
