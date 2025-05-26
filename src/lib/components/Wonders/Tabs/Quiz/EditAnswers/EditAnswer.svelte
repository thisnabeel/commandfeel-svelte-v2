<script>
	import Api from '$lib/api/api';
	import Update from '$lib/functions/debounce';
	// import { set } from 'svelte';
	import Editor from 'cl-editor/src/Editor.svelte';

	export let quiz;
	async function addChoice() {
		const response = await Api.post('/quiz_choices.json', {
			body: 'untitled',
			position: quiz.choices.length + 1,
			quiz_id: quiz.id,
			correct: true
		});
		quiz.choices = [...quiz.choices, response];
	}

	async function toggleCorrect(c) {
		const response = await Api.put('/quiz_choices/' + c.id + '.json', {
			correct: !c.correct
		});
		c.correct = response.correct;
		console.log(quiz.choices);
	}

	async function removeChoice(choice) {
		const response = await Api.delete('/quiz_choices/' + choice.id + '.json');
		quiz.choices = quiz.choices.filter((c) => c.id !== choice.id);
	}

	async function generateChoices(style = null) {
		const response = await Api.post('/quizzes/generate_choices.json', {
			quiz_id: quiz.id,
			style: style
		});
		console.log({ response });
		quiz.choices = response;
	}
</script>

{#each quiz.choices as choice}
	<li class="choice">
		<!-- <textarea
			class="form-control"
			bind:value={choice.body}
			on:keydown={() => {
				Update(`/quiz_choices/${choice.id}.json`, {
					body: choice.body
				});
			}}
		/> -->
		<Editor
			html={choice.body}
			on:change={(evt) => {
				const value = evt.detail;
				console.log('saving value', value);
				// save(key, value);
				Update(`/quiz_choices/${choice.id}.json`, {
					body: value
				});
			}}
		/>

		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="fa fa-circle toggle-correct"
			class:correct={choice.correct}
			on:click={async () => {
				const response = await Api.put('/quiz_choices/' + choice.id + '.json', {
					correct: !choice.correct
				});
				choice.correct = response.correct;
			}}
		/>
		<div class="fa fa-times remove-choice" on:click={() => removeChoice(choice)} />
	</li>
{/each}
<div class="adder">
	<div class="btn btn-outline-info btn-block" on:click={addChoice}>
		<i class="fa fa-plus" />
	</div>

	<div class="btn btn-outline-warning btn-block" on:click={() => generateChoices()}>
		<i class="fa fa-bolt" />
	</div>

	<div class="btn btn-outline-warning btn-block" on:click={() => generateChoices('multiple')}>
		<i class="fa fa-bolt" /> <i class="fa fa-list" />
	</div>
</div>

<style>
	.adder {
		display: flex;
		height: auto;
	}

	.adder > div:nth-child(1) {
		flex: 1 1 70%;
	}
	.adder > div:nth-child(2) {
		flex: 1 1 10%;
	}
	.adder > div:nth-child(3) {
		flex: 1 1 20%;
	}
	:global(.cl-actionbar) {
		/* display: none; */
		font-size: 12px;
	}

	:global(.cl) {
		/* box-shadow: none !important; */
	}
	:global(.cl-content) {
		background-color: transparent !important;
		height: max-content !important;
	}
	nav.flex {
		display: flex;
	}

	nav.flex > li {
		flex: 1 1 33%;
		text-align: center;
		padding: 8px;
		font-size: 12px;
	}

	.active {
		background: purple;
		color: #fff;
	}

	.choice {
		position: relative;
	}

	.remove-choice {
		position: absolute;
		right: -27px;
		top: 10px;
	}

	.toggle-correct {
		position: absolute;
		left: -27px;
		top: 10px;
		color: red;
	}

	.toggle-correct.correct {
		color: green !important;
	}
</style>
