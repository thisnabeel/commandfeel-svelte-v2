<script>
	import API from '$lib/api/api';

	export let proof_link;
	export let editable;

	let editing = false;
	$: icon();

	function icon() {
		if (proof_link.url.includes('github')) {
			return '/github.png';
		}
	}

	async function saveChanges() {
		editing = false;
		proof_link = await API.put(`/proof_links/${proof_link.id}.json`, proof_link);
	}
</script>

<li class="proof_link">
	{#if editable}
		<i class="fa fa-cog edit" on:click={() => (editing = !editing)} />
	{/if}

	{#if !editing}
		<a href={proof_link.url} class="card" target="_blank">
			<div class="flex">
				<img src={icon()} alt="" class="logo" />
				<div class="link">{proof_link.title || proof_link.url}</div>
			</div>
		</a>
	{/if}

	{#if editing}
		<div class="card">
			<div class="">
				<!-- <div class="link">{proof_link.title || proof_link.url}</div> -->
				<div class="form-group">
					<label for="url">Url:</label>
					<input type="text" class="form-control" bind:value={proof_link.url} />
				</div>

				<div class="form-group">
					<label for="title">Title:</label>
					<input type="text" class="form-control" bind:value={proof_link.title} />
				</div>

				<div class="form-group">
					<label for="description">Description:</label>
					<input type="text" class="form-control" bind:value={proof_link.description} />
				</div>

				<hr />
				<div class="btn btn-outline-primary" on:click={saveChanges}>Save Changes</div>
				<div class="btn btn-outline-danger" on:click={saveChanges}>Delete</div>
			</div>
		</div>
	{/if}
</li>

<style>
	.form-group {
		display: flex;
	}

	.form-group label {
		flex: 1 1 16%;
		text-align: right;
		padding-right: 10px;
	}
	.delete {
		position: absolute;
		left: -25px;
		top: 10px;
	}

	.edit {
		position: absolute;
		right: -25px;
		top: 10px;
	}
	.flex {
		display: flex;
	}
	.link {
		overflow-wrap: break-word;
		padding-left: 10px;
		width: 80%;
	}
	a {
		display: block;
	}
	.logo {
		width: 60px;
		object-fit: cover;
	}

	.proof_link {
		position: relative;
	}

	.card {
		border-radius: 6px;
		border: 1px solid #ccc;
		padding: 1em;
	}

	.proof_link a:hover {
		background: #dfe3e694;
	}
</style>
