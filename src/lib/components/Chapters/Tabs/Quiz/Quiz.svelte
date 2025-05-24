<script>
	// @ts-nocheck

	import Api from '$lib/api/api';
	import { modals } from 'svelte-modals';
	// import ChapterModal from '$lib/modals/videos/chapter.svelte';
	import { goto } from '$app/navigation';
	import EditAnswer from './EditAnswers/EditAnswer.svelte';
	import { user } from '$lib/stores/user';
	import Swal from 'sweetalert2';
	import API from '$lib/api/api';
	import { onMount } from 'svelte';

	export let refresh = () => {};
	export let chapter;
	export let quiz;
	export let destroy;
	export let editable = true;
	export let linkable = false;
	export let hideQuiz;

	let input;
	let html;
	let timer;

	const debounce = (v) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const response = await Api.put('/quizzes/' + quiz.id + '.json', {
				question: v,
				method: '_post'
			});
			// let response = await Api.get("/quizzes/"+quiz.id+".json")
			console.log('response', response);
		}, 1000);
	};

	let showChoices = false;

	let ankiSaving = false;

	//
	async function ankiSave(category) {
		if (ankiSaving) return;
		if (!$user) {
			Swal.fire('Unauthorized', 'Please Sign in to save questions to your Study List', 'error');
		} else {
			// console.log({ category });
			ankiSaving = true;

			const res = await API.post('/user_quiz_statuses.json', {
				user_id: $user.id,
				quiz_id: quiz.id,
				status: category
			});
			console.log({ res });
			hideQuiz(quiz);
			ankiSaving = false;
		}
	}

	let media = [];
	let mediaRecorder = null;
	let audioPlayer = null;
	let recording = false;
	let stream = null;
	onMount(async () => {});

	async function startStream() {
		stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(stream);
		const media = [];

		mediaRecorder.ondataavailable = (e) => media.push(e.data);

		mediaRecorder.onstop = function () {
			const blob = new Blob(media, { type: 'audio/mpeg' });
			media.length = 0; // Clear the media array
			console.log(blob);
			const audioUrl = URL.createObjectURL(blob);

			// Set the audio element's 'src' attribute to the object URL
			audioPlayer.src = audioUrl;

			audioPlayer.play();
		};

		mediaRecorder.start();
	}

	function stopStream() {
		if (stream) {
			stream.getTracks().forEach(function (track) {
				track.stop();
			});
		}
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			mediaRecorder = null;
			stream = null; // Set mediaRecorder to null
		}
	}

	function toggleRecording() {
		if (recording) {
			stopStream();
		} else {
			startStream();
		}

		recording = !recording;
	}

	// Additional cleanup if needed
	window.addEventListener('beforeunload', () => {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
	});
</script>

<li class="quiz" class:has_video={quiz && quiz.preview}>
	{#if $user && $user.admin === true && editable}
		<span contenteditable on:keyup={(e) => debounce(event.target.innerHTML)}
			>{@html quiz.question}</span
		>

		<span class="fa fa-trash" on:click={() => destroy(quiz.id)} />

		<hr />
		<EditAnswer {quiz} />
	{:else}
		<div>
			<div>
				{@html quiz.question}
				<br /><br />
				<!-- <div class="row" style="margin-bottom: 6px">
					<div class="col-lg-12 col-md-12 col-sm-12">
						<div class="btn btn-block btn-outline-primary">
							<i class="fa fa-microphone"></i>
						</div>
					</div>
				</div> -->
				<audio src="" bind:this={audioPlayer} style="display:none" />
				<i class="fa fa-microphone record" class:recording on:click={toggleRecording} />
				<div class="row">
					<div class="col-lg-6 col-md-6 col-sm-6">
						<div class="btn btn-block btn-success" on:click={() => ankiSave(1)}>
							{#if !$user}
								<i class="fa fa-lock" />
							{/if} Confident
						</div>
					</div>
					<div class="col-lg-6 col-md-6 col-sm-6">
						<div class="btn btn-block btn-danger" on:click={() => ankiSave(2)}>
							{#if !$user}
								<i class="fa fa-lock" />
							{/if} Stuttering
						</div>
					</div>
				</div>
				<hr />
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="btn btn-info" on:click={() => (showChoices = !showChoices)}>
					{#if showChoices && quiz.choices}
						{#if quiz.choices.length > 1}
							Hide Choices
						{:else}
							Hide Answer
						{/if}
					{:else if quiz.choices.length > 1}
						Show Choices
					{:else}
						Show Answer
					{/if}
				</div>
			</div>

			{#if showChoices}
				{#if quiz.choices.length === 0}
					<hr />
					<span class="choice">{quiz.chapter.title}</span>
				{/if}

				{#if quiz.choices.length === 1}
					<hr />
					<span class="choice">{@html quiz.choices[0].body}</span>
				{/if}

				{#if quiz.choices.length > 1}
					<hr />
					<ul class="choices clean-list">
						{#each quiz.choices as choice}
							<li>{@html choice.body}</li>
						{/each}
					</ul>
				{/if}
			{/if}
		</div>
	{/if}
	{#if linkable}
		<span class="fa fa-link link" on:click={() => goto('/chapters/' + quiz.quizable_id)} />
	{/if}
</li>

<style>
	.record {
		position: absolute;
		top: 10px;
		right: 10px;
		color: #ccc;
	}

	.record.recording {
		color: red !important;
		animation: hover 3s ease infinite;
	}

	.record:hover {
		color: purple;
	}
	.btn-block {
		display: block;
	}
	.choice {
		margin: 20px;
		display: block;
		font-size: 20px;
		font-family: 'GreyCliffCF-Light';
	}
	.link {
		position: absolute;
		left: -40px;
		top: 20px;
	}
	.hidden {
		display: none;
	}

	li {
		list-style: none;
		padding: 30px;
		position: relative;

		/* margin-bottom: 10px; */
		/* background: #e6d2ff; */

		margin-bottom: 10px;
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 1px 1px 5px 3px #ccc;
	}

	.fa-trash {
		position: absolute;
		left: -7%;
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

		.quizzes .has_video {
			padding-top: 55px;
		}

		.choice {
			margin: 0;
		}

		.link {
			position: absolute;
			left: 6px;
			top: 10px;
			font-size: 18px;
		}
	}
</style>
