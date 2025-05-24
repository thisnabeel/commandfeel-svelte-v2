<script>
	import API from '$lib/api/api';
	import Tester from '$lib/components/Tester/Tester.svelte';
	import debounce from '$lib/functions/debounce';
	import Editor from 'cl-editor/src/Editor.svelte';

	export let job;
	export let destroyJob;

	let isOpen = false;
	let activeTab = 1;
	let jobSkills = [];

	$: {
		if (isOpen && activeTab === 1) {
			findJobSkills();
		}
	}

	async function findJobSkills() {
		jobSkills = await API.get(`/saved_jobs/${job.id}/find_skills.json`);
	}

	async function saveJob() {
		debounce(`/saved_jobs/${job.id}.json`, job);
	}
</script>

<li class="job" class:open={isOpen}>
	<div class="head" on:click={() => (isOpen = !isOpen)}>
		{job.title} <br /><small class="company">@ {job.company}</small>
	</div>
	<i class="fa fa-trash remove-job" on:click={() => destroyJob(job.id)} />

	{#if isOpen}
		<div class="content">
			<div class="lil-nav">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div on:click={() => (activeTab = 0)} class:activeTab={activeTab === 0}>
					Job Description
				</div>
				<div
					on:click={() => {
						findJobSkills();
						activeTab = 1;
					}}
					class:activeTab={activeTab === 1}
				>
					Pop Quiz
				</div>
			</div>

			{#if activeTab === 0}
				<!-- <div class="jd">{@html job.jd}</div> -->
				<Editor
					html={job.jd}
					on:change={(evt) => {
						// const value = evt.detail;
						job.jd = evt.detail;
						saveJob();
					}}
				/>
			{/if}

			{#if activeTab === 1}
				<div class="tester">
					<Tester {jobSkills} />
				</div>
				<!-- <div class="jd">{@html job.jd}</div> -->
			{/if}
		</div>
	{/if}
</li>

<style>
	.company {
		background: rgba(235, 235, 255, 0.474);
		padding: 7px;
		border-radius: 10px;
		/* color: #fff; */
		margin-top: 10px;
		display: inline-block;
	}
	.tester {
		padding: 1em;
	}
	.lil-nav {
		display: flex;
		margin: 1em;
	}
	.lil-nav div {
		flex: 1 1 50%;
		text-align: center;
		font-size: 32px;
		padding: 1em;
	}

	.lil-nav .activeTab {
		background-color: rgb(113, 4, 113);
		color: #fff;
	}
	.jd {
		padding: 2em;
		background-color: #fff;
	}
	.remove-job {
		position: absolute;
		left: -30px;
		top: 10px;
		color: #ccc;
	}

	.remove-job:hover {
		color: red;
	}

	.job .head {
		padding: 22px;
		font-size: 24px;
		display: block;

		cursor: pointer;
	}

	.job .head:hover {
		background: #1be8f1;
	}

	.job.open .head {
		background: #000;
		color: #fff;
	}
	.job {
		position: relative;
		border: 4px solid rgb(22, 22, 22);
		display: block;
		margin: 0 auto;
		margin-bottom: 10px;
		max-width: 450px;
	}

	.job.open {
		max-width: 100%;
	}

	@media (max-width: 480px) {
		.lil-nav {
			margin: 0;
		}

		.lil-nav div {
			font-size: 18px;
		}
	}
</style>
