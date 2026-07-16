<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Api from '$lib/api/api.js';
	import { user } from '$lib/stores/user';
	import CohortDashboard from '$lib/components/Landing/CohortDashboard.svelte';

	let membership = null;
	let loading = true;
	let error = '';
	let loadedFor = null;

	$: cohortId = $page.params.id;

	async function load(id) {
		if (!$user?.admin) {
			error = 'Admin access required.';
			loading = false;
			membership = null;
			return;
		}
		if (!id) {
			error = 'Missing cohort.';
			loading = false;
			membership = null;
			return;
		}
		if (loadedFor === id && membership) return;

		try {
			loading = true;
			error = '';
			membership = await Api.post(`/cohorts/${id}/enter_as_admin`);
			loadedFor = id;
		} catch (err) {
			error =
				err?.response?.data?.error ||
				err?.response?.data?.errors?.join?.(', ') ||
				err?.message ||
				'Failed to open dashboard.';
			membership = null;
			loadedFor = null;
		} finally {
			loading = false;
		}
	}

	$: if ($user !== undefined && cohortId) {
		load(cohortId);
	}
</script>

<svelte:head>
	<title>Cohort dashboard</title>
</svelte:head>

<div class="page">
	<div class="bar">
		<button type="button" class="back" on:click={() => goto('/cohorts')}>
			← Back to cohorts
		</button>
	</div>

	{#if loading}
		<p class="status">Opening dashboard…</p>
	{:else if error}
		<p class="status error">{error}</p>
	{:else if membership}
		<CohortDashboard memberships={[membership]} adminPreview={true} />
	{/if}
</div>

<style>
	.page {
		min-height: 40vh;
	}

	.bar {
		max-width: 920px;
		margin: 0 auto;
		padding: 1rem 1.25rem 0;
	}

	.back {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		color: #0a5f63;
		cursor: pointer;
	}

	.back:hover {
		text-decoration: underline;
	}

	.status {
		max-width: 920px;
		margin: 1.5rem auto;
		padding: 0 1.25rem;
		color: #3a545c;
	}

	.status.error {
		color: #b02a37;
	}
</style>
