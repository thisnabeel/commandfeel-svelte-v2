<script>
	import API from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';
	import Job from './Job.svelte';
	import Editor from 'cl-editor/src/Editor.svelte';

	onMount(() => {
		getMyJobs();
	});

	let jobs = {
		interested: []
	};

	let adder = false;
	let titleInput = '';
	let companyInput = '';
	let linkInput = '';
	let jdInput = '';

	async function getMyJobs() {
		if (!$user) return;
		const res = await API.get(`/users/${$user.id}/jobs.json`);
		jobs = res;
	}

	async function addJob() {
		if (!$user) return;
		if (companyInput.length < 2) {
			alert('Please Enter Company Name');
			return;
		}
		if (jdInput.length < 2) {
			alert('Please Paste Job Description');
			return;
		}
		if (titleInput.length < 2) {
			alert('Please Enter Position Title');
			return;
		}

		const res = await API.post(`/saved_jobs.json`, {
			title: titleInput,
			company: companyInput,
			position: jobs.length + 1,
			jd_link: linkInput,
			jd: jdInput,
			stage: 'interested',
			user_id: $user.id
		});
		jobs.interested = [...jobs.interested, res];
		titleInput = companyInput = linkInput = jdInput = '';
		adder = false;
	}

	async function destroyJob(id) {
		if (!$user) return;
		await API.delete(`/saved_jobs/${id}.json`);
		jobs.interested = jobs.interested.filter((j) => j.id !== id);
	}
</script>

<h1>
	My Jobs:
	{#if adder}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="btn btn-warning" on:click={() => (adder = !adder)}>
			<i class="fa fa-times" />
		</div>
	{:else}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="btn btn-outline-warning" on:click={() => (adder = !adder)}>
			<i class="fa fa-plus" />
		</div>
	{/if}
</h1>
{#if adder}
	<div>
		<input
			type="text"
			placeholder="Title... example 'Lead Software Engineer'"
			bind:value={titleInput}
			class="form-control"
		/>

		<input
			type="text"
			placeholder="Company.. example 'Disney Parks'"
			bind:value={companyInput}
			class="form-control"
		/>

		<input
			type="text"
			placeholder="JD Link.. example ''"
			bind:value={linkInput}
			class="form-control"
		/>

		<!-- <textarea
			name=""
			id=""
			cols="30"
			rows="10"
			placeholder="Job Description Text.."
			bind:value={jdInput}
			class="form-control"
		/> -->

		<Editor
			on:change={(evt) => {
				// const value = evt.detail;
				jdInput = evt.detail;
			}}
		/>

		<div class="btn btn-block btn-outline-primary" on:click={addJob}>Add Job</div>
	</div>
{/if}
<ul class="clean-list jobs">
	{#if jobs && jobs.interested}
		{#each jobs.interested as job}
			<Job {job} {destroyJob} />
		{/each}
	{/if}
</ul>

<style>
	.jobs {
		/* display: block;
		margin: 0 auto;
		max-width: 550px; */
	}
</style>
