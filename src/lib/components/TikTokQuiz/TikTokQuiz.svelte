<script>
	import { writable } from 'svelte/store';
	import { Motion } from 'svelte-motion';
	import { modals } from 'svelte-modals';

	export let onClose; // Function passed from parent to close modal

	let currentIndex = writable(0);
	let isScrolling = false; // Lock to prevent multiple swipes

	const questions = [
		{
			question: 'What is the time complexity of binary search?',
			choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)']
		},
		{
			question: 'Which language is primarily used for backend development?',
			choices: ['JavaScript', 'HTML', 'CSS', 'SQL']
		},
		{
			question: "What does 'REST' stand for?",
			choices: ['Random Event Standard Testing', 'Representational State Transfer']
		},
		{ question: 'Which data structure uses LIFO?', choices: ['Queue', 'Stack'] },
		{
			question: 'Which sorting algorithm has worst-case O(n²)?',
			choices: ['Merge Sort', 'Quick Sort', 'Bubble Sort', 'Heap Sort']
		},
		{
			question: 'What does SQL stand for?',
			choices: ['Structured Query Language', 'Simple Query Language']
		},
		{
			question: "Which HTTP status code means 'Not Found'?",
			choices: ['400', '403', '404', '500']
		},
		{
			question: 'What is the main advantage of linked lists over arrays?',
			choices: ['Faster access time', 'Efficient insertions and deletions']
		},
		{
			question: "What does 'git clone' do?",
			choices: ['Creates a new repository', 'Copies a repository']
		},
		{
			question: 'Which of these is not a JavaScript framework?',
			choices: ['React', 'Vue', 'Angular', 'Django']
		}
	];

	function changeIndex(delta) {
		if (isScrolling) return;
		isScrolling = true;

		currentIndex.update((i) => {
			let newIndex = Math.min(Math.max(i + delta, 0), questions.length - 1);
			setTimeout(() => (isScrolling = false), 350);
			return newIndex;
		});
	}

	function handleWheel(event) {
		if (!isScrolling) {
			if (event.deltaY > 0) changeIndex(1);
			if (event.deltaY < 0) changeIndex(-1);
		}
	}

	function handleKeydown(event) {
		if (event.key === 'ArrowDown') changeIndex(1);
		if (event.key === 'ArrowUp') changeIndex(-1);
	}

	let touchStartY = 0;
	let swipeThreshold = 50;

	function handleTouchStart(event) {
		touchStartY = event.touches[0].clientY;
	}

	function handleTouchEnd(event) {
		let touchEndY = event.changedTouches[0].clientY;
		let swipeDistance = touchStartY - touchEndY;

		if (!isScrolling) {
			if (swipeDistance > swipeThreshold) changeIndex(1);
			else if (swipeDistance < -swipeThreshold) changeIndex(-1);
		}
	}

	function selectChoice(index, choice) {
		console.log(`Question ${index + 1}: Selected - ${choice}`);
	}
</script>

<div
	class="modal-container"
	on:wheel={handleWheel}
	on:keydown={handleKeydown}
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
	tabindex="0"
>
	<!-- Close button -->
	<i
		class="fa fa-times close-btn"
		on:click={() => {
			modals.closeAll();
		}}
	/>

	{#each questions as q, i}
		{#if $currentIndex === i}
			<Motion.div
				class="content"
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: 'easeOut' }}
			>
				<div class="question">{q.question}</div>
				<div class="choices">
					{#each q.choices as choice}
						<Motion.div
							class="choice"
							on:click={() => selectChoice(i, choice)}
							whileTap={{ scale: 0.95 }}
						>
							{choice}
						</Motion.div>
					{/each}
				</div>
			</Motion.div>
		{/if}
	{/each}
</div>

<style>
	.modal-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: white;
		outline: none;
	}

	.close-btn {
		position: absolute;
		top: 20px;
		right: 25px;
		font-size: 1.8rem;
		cursor: pointer;
		color: white;
		transition: 0.3s;
	}

	.close-btn:hover {
		color: #ff4444;
		transform: scale(1.2);
	}

	.question {
		text-align: center;
		font-size: 1.6rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}

	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.choice {
		padding: 0.8rem 1.6rem;
		border: 2px solid white;
		cursor: pointer;
		transition: 0.15s;
		border-radius: 8px;
		text-align: center;
		font-size: 1.1rem;
	}

	.choice:hover {
		background: white;
		color: black;
		transform: scale(1.05);
	}
</style>
