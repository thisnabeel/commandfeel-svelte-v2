<script>
	import { skills } from '$lib/stores/main';

	export let showInput;
	let topic = '';
	export let topics = [];
	export let jobSkills;
	export let saveTopics;
	export let prefillers = [];

	let allSkills = null;

	skills.subscribe((value) => {
		console.log('skillsMap', value);
		allSkills = value;

		if (jobSkills) {
			prefillers = jobSkills.map((s) => s.title);
		}
		if (prefillers.length > 0) {
			topics = allSkills.filter((s) => prefillers.includes(s.title));
			console.log('prefillers', topics);
			saveTopics(topics);
		}

		// test();
	});

	let results = [];
	let showResults;

	function search() {
		if (topic.length < 2) {
			results = [];
			return;
		}
		results = allSkills.filter((s) => s.title.toLowerCase().includes(topic.toLocaleLowerCase()));
		console.log(results);
		showResults = true;
	}

	function addToTest(result) {
		if (topics.filter((o) => o.id === result.id).length > 0) {
			showResults = false;
			return;
		}
		topics = [...topics, result];
		showResults = false;
		saveTopics(topics);
	}

	function hideResults() {
		showResults = false;
	}

	function removeTopic(item) {
		if (jobSkills && jobSkills.length > 0) {
			topics.find((t) => t.id === item.id).disabled = !topics.find((t) => t.id === item.id)
				.disabled;
			topics = topics;
		} else {
			topics = topics.filter((topic) => item.id !== topic.id);
		}
		saveTopics(topics);
	}

	function clearer() {
		if (jobSkills && jobSkills.length > 0) {
			topics = topics.map((t) => {
				t.disabled = true;
				return t;
			});
		} else {
			topics = [];
		}
		saveTopics(topics);
	}
	let hoveringResults = false;
</script>

<div class="input-wrapper">
	{#if showInput}
		<input
			type="text"
			class="form-control tester"
			placeholder="Search from {allSkills.length} Skills to Test..."
			bind:value={topic}
			on:keyup={search}
			on:mouseenter={() => (showResults = true)}
			on:mouseleave={() => {
				setTimeout(function () {
					if (!hoveringResults) {
						hideResults();
					}
				}, 50);
			}}
		/>
	{/if}
	{#if results.length > 0 && showResults}
		<div
			class="results clean-list"
			on:mouseenter={() => {
				showResults = true;
				hoveringResults = true;
			}}
			on:mouseleave={() => {
				hideResults();
				hoveringResults = false;
			}}
		>
			{#each results as result}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li
					class="result"
					class:present={topics.filter((t) => t.id === result.id).length > 0}
					on:click={() => addToTest(result)}
				>
					{result.title}
				</li>
			{/each}
		</div>
	{/if}
</div>
<div class="topics clean-list">
	{#each topics as item}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<li
			class="topic"
			class:disabled={item.disabled}
			on:click={() => {
				removeTopic(item);
			}}
		>
			{item.title}
		</li>
	{/each}

	{#if topics.filter((t) => !t.disabled).length > 0}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<li
			class="topic clearer"
			on:click={() => {
				clearer();
			}}
		>
			Clear All
		</li>
	{/if}
</div>

<style>
	.present {
		background-color: purple;
		color: #fff;
	}

	.input-wrapper {
		position: relative;
	}
	.topic {
		display: inline-block;
		margin: 8px;
		font-size: 24px;
		background-color: purple;
		color: #fff;
		padding: 10px;
		border-radius: 10px;
		line-height: 1;
	}

	.clearer {
		background-color: transparent;
		color: #000;
	}

	.clearer:hover {
		background-color: rgb(158, 102, 13);
		color: #fff;
	}

	.topic.disabled {
		background-color: #ccc;
	}

	.btn-blocked {
		background-color: gray;
		color: #fff;
	}
	.tester {
		font-size: 44px;
	}
	.result {
		padding: 16px;
	}

	.result:hover,
	.present:hover {
		background: rgb(255, 255, 180);
		color: #000;
	}

	.results {
		padding: 10px;
		background: #fff;
		font-size: 22px;
		/* display: none; */
		/* position: absolute; */
		top: 80px;
		width: 100%;
		border: 2px solid #5f4a4a;
		z-index: 999;
		position: absolute;
	}

	@media (max-width: 480px) {
		.topic {
			display: inline-block;
			margin: 2px;
			font-size: 14px;
			line-height: 1;
			background-color: purple;
			color: #fff;
			padding: 10px;
			border-radius: 10px;
		}
	}
</style>
