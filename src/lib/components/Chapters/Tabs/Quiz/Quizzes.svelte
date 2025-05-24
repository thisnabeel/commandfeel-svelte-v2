<script>
	export let chapter;

	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api.js';

	import Quiz from './Quiz.svelte';
	import QuizSet from './QuizSet.svelte';
	import API from '$lib/api/api.js';

	const addQuiz = async () => {
		const response = await Api.post('/quizzes.json', {
			quizable_id: chapter.id,
			quizable_type: 'Chapter'
		});

		chapter.quizzes = [...chapter.quizzes, response];
	};

	const destroy = async (id) => {
		const response = await Api.delete('/quizzes/' + id + '.json');
		chapter.quizzes = chapter.quizzes.filter((q) => q.id !== id);
	};

	const hideQuiz = async (quiz) => {
		const id = quiz.id;
		chapter.quizzes = chapter.quizzes.filter((q) => q.id !== id);
	};

	const generateQuiz = async (category = null) => {
		const response = await Api.post('/chapters/generate_quiz.json', {
			id: chapter.id,
			category: category
		});

		chapter.quizzes = [...chapter.quizzes, response];
	};

	async function addQuizSet(title = 'Untitled') {
		const res = await API.post('/quiz_sets.json', {
			quiz_setable_id: chapter.id,
			quiz_setable_type: 'Chapter',
			position: chapter.quiz_sets.length + 1,
			title: title
		});
		console.log({ res });
		chapter.quiz_sets = [...chapter.quiz_sets, res];
	}

	async function removeSet(payload) {
		console.log({ payload });
		const res = await API.delete('/quiz_sets/' + payload.id + '.json');
		chapter.quiz_sets = chapter.quiz_sets.filter((s) => s.id !== payload.id);
	}

	const suggestedTitles = ['General', 'Jeopardy', 'Scenarios', 'Differences'];
</script>

<div class="quiz_sets">
	<ul class="clean-list">
		{#each chapter.quiz_sets as set}
			<QuizSet {chapter} {set} {removeSet} />
		{/each}
	</ul>

	{#if $user && $user.admin}
		<div class="adder">
			<div class="add-quiz btn btn-outline-warning" on:click={addQuizSet}>+</div>
		</div>
		<div class="flex adder">
			{#each suggestedTitles.filter((t) => !chapter.quiz_sets
						.map((s) => s.title)
						.includes(t)) as title}
				<div class="">
					<div class="btn btn-outline-warning btn-block" on:click={() => addQuizSet(title)}>
						{title}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.quiz_sets {
		margin-top: 10px;
	}
	.adder {
		font-size: 22px;
		color: #ffd67f;
		display: flex;
	}

	.adder > div {
		flex: 1;
		text-align: center;
		margin: 1px;
	}

	.add-quiz {
		font-size: 24px;
	}

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

	@media (max-width: 480px) {
		.quizzes {
			width: 95%;
		}
	}
</style>
