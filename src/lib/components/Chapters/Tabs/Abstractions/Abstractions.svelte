<script>
	export let chapter;
	import { user } from '$lib/stores/user';

	import Abstraction from './Abstraction.svelte';

	import Api from '$lib/api/api';
	async function handleRemoveAbstraction(payload) {
		console.log({ payload });
		await Api.delete('/abstractions/' + payload.id + '.json');
		chapter.abstractions = chapter.abstractions.filter((s) => s.id !== payload.id);
	}

	const addAbstraction = async () => {
		const response = await Api.post('/abstractions.json', {
			abstractable_id: chapter.id,
			abstractable_type: 'Chapter'
		});
		console.log(response);
		chapter.abstractions = [...chapter.abstractions, response];
		// console.log('fetch chapter', chapter);
		// fetchChapter(chapter.id);
	};

	const generateAbstraction = async () => {
		const response = await Api.post('/chapters/generate_abstraction.json', {
			id: chapter.id
		});

		chapter.abstractions = [...chapter.abstractions, response];
	};

	let requested = false;
</script>

<ul class="abstractions">
	{#if $user && $user.admin}
		<div class="adder">
			<div class="add-abstraction" on:click={addAbstraction}>+</div>
			<div class="btn btn-warning generate-abstraction" on:click={generateAbstraction}>
				<i class="fa fa-bolt" />
			</div>
		</div>
	{/if}
	{#if chapter && chapter.abstractions.length > 0}
		{#each chapter.abstractions as abstraction}
			<li>
				<Abstraction
					{chapter}
					{abstraction}
					user={$user}
					removeAbstraction={handleRemoveAbstraction}
				/>
			</li>
		{/each}
	{:else}
		<div class="cta">
			<h1>No Abstractions Yet.</h1>
			<br />
			{#if !requested}
				<div class="btn btn-warning" on:click={() => (requested = true)}>Request Abstraction</div>
			{:else}
				<div class="requested">
					Thank You for requesting.<br /> Our team will start simplifying this concept soon.
				</div>
			{/if}
		</div>
	{/if}
</ul>

<style>
	.cta {
		background: rgb(207, 41, 41);
		color: #fff;
		display: block;
		padding: 3em;
		border-radius: 8px;
	}

	.cta .btn {
		display: block;
		font-size: 22px;
	}

	.cta h1 {
		color: #fff;
	}
	.adder {
		font-size: 72px;
		position: absolute;
		left: 35%;
		/* display: inline; */
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
		display: -webkit-inline-box;
	}
	/* 
	.add-abstraction {
		font-size: 72px;
		position: absolute;
		right: 50%;
		display: inline;
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
	} */

	.tab {
		padding: 14px;
	}
	.tab.active {
		background-color: #000;
		color: #fff;
	}
	.flex {
		display: flex;
	}

	.flex > div {
		flex: 1 1 33%;
		text-align: center;
	}

	.title {
		padding: 40px 0px;
	}
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		position: relative;
	}

	.abstractions {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		width: 70%;
		margin: 0 auto;
		padding: 20px 0;
	}

	@media (max-width: 480px) {
		.abstractions {
			width: 100%;
		}
	}
</style>
