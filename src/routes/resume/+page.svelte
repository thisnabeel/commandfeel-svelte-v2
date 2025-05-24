<script>
	import API from '$lib/api/api';

	let jd;
	let points = [];

	async function promptResume() {
		points = await API.post(`/resumes/prompt.json`, {
			jd: jd
		});

		console.log(points);
	}
</script>

<h1>Resume Generator:</h1>
<!-- svelte-ignore a11y-click-events-have-key-events -->

<textarea name="" id="" cols="30" rows="7" class="form-control" bind:value={jd} />
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="btn btn-primary" on:click={promptResume}>Export Doc</div>
