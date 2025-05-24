<script>
	import Api from '$lib/api/api';

	import { user } from '$lib/stores/user';

	import { modals } from 'svelte-modals';
	import SubmitterModal from '$lib/modals/challenges/submitter.svelte';
	import CodeCompiler from '$lib/components/CodeCompiler/Box.svelte';
	import Editor from '$lib/components/CodeCompiler/Box.svelte';
	import CodeBox from '$lib/components/CodeCompiler/Box.svelte';
	import API from '$lib/api/api';

	export let refresh = () => {};
	export let skill = null;
	export let challenge;
	export let destroy;
	export let editable = false;
	export let codable = false;
	export let language;

	let input;
	let html;
	let timer;
	let expand;
	let output;

	const debounce = (v) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const response = await Api.put('/challenges/' + challenge.id + '.json', {
				title: v,
				method: '_post'
			});
			// let response = await Api.get("/challenges/"+challenge.id+".json")
			console.log('response', response);
		}, 1000);
	};

	async function runCode(code) {
		console.log({ code });

		const res = await API.post(`/programming_languages/${language.id}/execute.json`, {
			code: code,
			language: language
		});

		console.log({ res });

		output = res.output;
	}

	//
</script>

<li class:has_video={challenge && challenge.preview}>
	{#if $user && $user.admin === true}
		<span contenteditable on:keyup={(e) => debounce(event.target.innerHTML)}
			>{@html challenge.title}</span
		>
		{#if !editable}
			<span class="fa fa-trash" on:click={() => destroy(challenge.id)} />
		{/if}
	{:else}
		<span>{@html challenge.title}</span>
	{/if}
	<span class="fa fa-expand" on:click={() => (expand = !expand)} />
	{#if expand}
		<div>
			{#if !codable}
				<hr />
				<div
					class="btn btn-block btn-primary"
					on:click={() => {
						modals.open(SubmitterModal, {
							challenge: challenge
						});
					}}
				>
					<i class="fa fa-document" /> Submit Proof
				</div>
			{/if}
			<hr />
			<div class="body">
				{challenge.body}
			</div>

			{#if codable && language}
				<CodeBox
					{language}
					runClicked={(code) => {
						runCode(code);
					}}
					runnable={true}
					pass={() => {}}
				/>

				{#if output}
					<div class="output">{@html output}</div>
				{/if}
			{/if}
		</div>
	{/if}
	<div class:hidden={!challenge.preview} class="abstra-play">
		<img class="abstra-preview" src={challenge.preview} />
	</div>
</li>

<style>
	.body {
		font-family: GreyCliffCF-Light;
	}
	.hidden {
		display: none;
	}

	li {
		list-style: none;
		padding: 30px;
		position: relative;

		margin-bottom: 10px;
		background: #7ff7ff;
	}

	.fa-trash {
		position: absolute;
		left: -7%;
		top: 39%;
	}

	.fa-expand {
		position: absolute;
		right: -7%;
		top: 39%;
	}

	.abstra-play {
		position: absolute;
		right: -122px;
		top: 14%;
		cursor: pointer;
		width: 130px;
		background: #ffd67f;
		padding: 50px;
		border-radius: 10px;
	}

	/* .abstra-play img {
        max-width: 100%;
    } */

	.abstra-preview {
		position: absolute;
		top: 12%;
		left: -6%;
		border-radius: 10px;
		max-width: 100%;
		z-index: 100;
	}

	@media (max-width: 480px) {
		.abstra-play {
			position: absolute;
			right: 0;
			left: 0;
			margin: 0 auto;
			top: -83px;
			cursor: pointer;
			padding: 55px;
			width: 7.5em;
		}

		.abstra-preview {
			position: absolute;
			top: 9px;
			left: 5px;
			border-radius: 10px;
			/* max-width: 100%; */
			max-width: 170px;
		}

		.challenges {
			width: 100%;
		}

		.challenges .has_video {
			padding-top: 55px;
		}

		.fa-expand {
			right: 10px;
		}
	}

	.output {
		padding: 10px;
		font-size: 24px;
		background: #000;
		color: #fff;
		border-radius: 8px;
		margin-top: 14px;
	}
</style>
