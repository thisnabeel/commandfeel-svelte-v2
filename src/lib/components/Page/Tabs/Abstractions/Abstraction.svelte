<script>
	import Api from '$lib/api/api';
	import { modals } from 'svelte-modals';

	export let user;
	export let abstraction;
	export let removeAbstraction = () => {};
	export let makeQuestFromAbstraction = () => {};
	export let element;
	export let elementType;

	const destroy = async (item) => {
		removeAbstraction(item);
	};

	let input;
	let html;
	let timer;

	function openElementVideo(element, abstraction) {
		// modals.open(ElementModal, { element: element, abstraction: abstraction });
	}

	const debounce = (v) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const response = await Api.put('/abstractions/' + abstraction.id + '.json', {
				body: v,
				method: '_post'
			});
			// let response = await Api.get("/abstractions/"+abstraction.id+".json")
			console.log('response', response);
		}, 1000);
	};
</script>

<li class="abstraction" class:has_video={abstraction && abstraction.preview}>
	{#if user && user.admin}
		<span contenteditable on:keyup={(e) => debounce(event.target.innerHTML)}
			>{@html abstraction.body}</span
		>
		<span class="fa fa-trash" on:click={() => destroy(abstraction)} />
		<span class="fa fa-bolt" on:click={() => makeQuestFromAbstraction(abstraction)} />
	{:else}
		<span>{@html abstraction.body}</span>
	{/if}
	<!-- <div
		class:hidden={!abstraction.preview}
		class="abstra-play"
		on:click={openElementVideo(element, abstraction)}
	>
		<img class="abstra-preview" src={abstraction.preview} />
	</div> -->
</li>

<style>
	.hidden {
		display: none;
	}

	.abstraction {
		padding: 30px;
		position: relative;
		margin-bottom: 10px;
		background: #ffd67f;
	}

	.fa-trash {
		position: absolute;
		left: -7%;
		top: 39%;
	}

	.fa-bolt {
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

		.abstractions {
			width: 100%;
		}

		.abstractions .has_video {
			padding-top: 55px;
		}

		.fa-bolt {
			right: 10px;
			top: 20px;
		}

		.fa-trash {
			left: 10px;
			top: 20px;
		}
	}
</style>
