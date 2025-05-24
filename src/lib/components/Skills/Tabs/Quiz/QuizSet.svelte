<script>
	import API from '$lib/api/api';
	import debounce from '$lib/functions/debounce';
	import Quiz from './Quiz.svelte';

	export let set;
	export let removeSet;
	export let skill;

	let prompt = '';

	let expanded = false;
	let aiMaker = false;

	const addQuiz = async () => {
		const response = await API.post('/quizzes.json', {
			quiz_set_id: set.id,
			question: 'Untitle',
			position: set.quizzes.length + 1,
			quizable_type: 'Skill',
			quizable_id: skill.id
		});

		set.quizzes = [...set.quizzes, response];
	};

	const generateQuiz = async (category) => {
		const response = await API.post('/skills/generate_quiz.json', {
			id: set.quiz_setable_id,
			category: category,
			quiz_set_id: set.id,
			prompt: prompt
		});

		set.quizzes = [...set.quizzes, response];
	};

	const destroy = async (id) => {
		const response = await API.delete('/quizzes/' + id + '.json');
		set.quizzes = set.quizzes.filter((q) => q.id !== id);
	};

	async function saveTitle(title) {
		await debounce(`/quiz_sets/${set.id}`, {
			title: title
		});
	}
</script>

<li class="set">
	<div
		class="head"
		on:click={(e) => {
			if (!e.target.closest('.toggle-ai-maker')) {
				expanded = !expanded;
			}
		}}
	>
		<span class="content" contenteditable="" on:keyup={(e) => saveTitle(e.target.innerHTML)}
			>{set.title}</span
		>
		<div class="toggle-ai-maker btn btn-warning" on:click={() => (aiMaker = !aiMaker)}>
			<i class="fa fa-bolt" />
		</div>
	</div>
	{#if expanded}
		<div class="remove" on:click={() => removeSet(set)}><i class="fa fa-trash" /></div>
		{#if aiMaker}
			<div class="ai-maker">
				<input type="text" placeholder="Enter Prompt..." class="form-control" bind:value={prompt} />
				<div class="adder">
					<div class="add-quiz btn btn-outline-warning" on:click={() => addQuiz()}>+</div>
					<div
						class="btn btn-outline-warning generate-quiz"
						on:click={() => generateQuiz('general')}
					>
						<i class="fa fa-bolt" /> General
					</div>
					<div
						class="btn btn-outline-warning generate-quiz"
						on:click={() => generateQuiz('jeopardy')}
					>
						<i class="fa fa-bolt" /> Jeopardy
					</div>
					<div
						class="btn btn-outline-warning generate-quiz"
						on:click={() => generateQuiz('general_mc')}
					>
						<i class="fa fa-bolt" /> <i class="fa fa-list" /> General
					</div>
					<div
						class="btn btn-outline-warning generate-quiz"
						on:click={() => generateQuiz('techniques_mc')}
					>
						<i class="fa fa-bolt" /> <i class="fa fa-list" /> Techniques
					</div>
					<div
						class="btn btn-outline-warning generate-quiz"
						on:click={() => generateQuiz('abstractions_mc')}
					>
						<i class="fa fa-bolt" /> <i class="fa fa-list" /> Abstractions
					</div>
					<div class="btn btn-outline-warning generate-quiz" on:click={() => generateQuiz('steps')}>
						<i class="fa fa-bolt" /> <i class="fa fa-list" /> Steps
					</div>
					<div
						class="btn btn-outline-warning generate-quiz"
						on:click={() => generateQuiz('scenario')}
					>
						<i class="fa fa-bolt" /> Scenario
					</div>
					<div
						class="btn btn-outline-warning generate-quiz"
						on:click={() => generateQuiz('scenario_mc')}
					>
						<i class="fa fa-bolt" /> <i class="fa fa-list" /> Scenario
					</div>
				</div>
			</div>
		{/if}
		<div class="quizzes">
			{#each set.quizzes as quiz}
				<Quiz {quiz} {destroy} />
			{/each}
		</div>
	{/if}
</li>

<style>
	.remove {
		position: absolute;
		top: 10px;
		left: -20px;
	}
	.set {
		margin-bottom: 6px;
		background: aliceblue;
		position: relative;
	}
	.head {
		background: #0e3f86;
		padding: 20px;
		color: #fff;
		border-radius: 4px;
		margin-bottom: 4px;
		font-size: 24px;
		position: sticky;
		top: 0;
		z-index: 999;
	}

	.ai-maker {
		padding: 20px;
		z-index: 999;
		position: sticky;
		top: 60px;
		background: aliceblue;
	}

	.toggle-ai-maker {
		padding: 20px;
		z-index: 999;
		position: absolute;
		top: 5px;
		right: 10px;
	}

	.head .content {
	}

	/* .quizzes {
        border: 4px solid #0e3f86;
        margin-top: -10px;
    } */

	.quizzes {
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
</style>
