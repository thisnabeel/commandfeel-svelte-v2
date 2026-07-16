<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Api from '$lib/api/api';
	import { user, credsView } from '$lib/stores/user';
	import { Button, Card, CardBody, CardHeader, Container } from 'sveltestrap';

	let cohorts = [];
	let slotsByCohort = {};
	let loading = true;
	let error = '';
	let applyingId = null;
	let success = '';

	function apiError(err, fallback) {
		return (
			err?.response?.data?.error ||
			(Array.isArray(err?.response?.data?.errors)
				? err.response.data.errors.join(', ')
				: null) ||
			err?.message ||
			fallback
		);
	}

	function requireAuth() {
		if ($user) return true;
		credsView.set('signIn');
		return false;
	}

	async function load() {
		if (!requireAuth()) {
			loading = false;
			return;
		}
		try {
			loading = true;
			error = '';
			cohorts = await Api.get('/cohorts');
			const results = await Promise.all(
				cohorts.map(async (c) => {
					const slots = await Api.get(`/cohort_users?cohort_id=${c.id}`);
					return [c.id, slots];
				})
			);
			slotsByCohort = Object.fromEntries(results);
		} catch (err) {
			error = apiError(err, 'Failed to load cohorts');
		} finally {
			loading = false;
		}
	}

	async function applyToSlot(slot) {
		if (!requireAuth()) return;
		try {
			applyingId = slot.id;
			error = '';
			success = '';
			await Api.post(`/cohort_users/${slot.id}/apply`, {});
			const slots = await Api.get(`/cohort_users?cohort_id=${slot.cohort_id}`);
			slotsByCohort = { ...slotsByCohort, [slot.cohort_id]: slots };
			success = `Applied for ${slot.occupation_title || 'this seat'}. An admin will review your application.`;
		} catch (err) {
			error = apiError(err, 'Failed to apply to slot');
		} finally {
			applyingId = null;
		}
	}

	onMount(load);
</script>

<div class="wrapper" in:fade>
	<Container class="py-4">
		<header class="page-head">
			<h1>Apply to a cohort</h1>
			<p>Pick an open occupation slot. Your application is reviewed by an admin.</p>
		</header>

		{#if error}
			<div class="alert alert-danger" role="alert">{error}</div>
		{/if}
		{#if success}
			<div class="alert alert-success" role="alert">{success}</div>
		{/if}

		{#if !$user}
			<p class="signed-out">Sign in to view open seats and apply.</p>
		{:else if loading}
			<div class="py-4 text-center">Loading…</div>
		{:else if cohorts.length === 0}
			<p class="text-muted py-4 text-center">No cohorts available yet.</p>
		{:else}
			<div class="cohort-list">
				{#each cohorts as cohort (cohort.id)}
					<Card class="cohort-card">
						<CardHeader>
							<strong>{cohort.title}</strong>
							{#if cohort.subtitle}
								<div class="text-muted small">{cohort.subtitle}</div>
							{/if}
							<div class="meta">
								{cohort.start_date || '—'} → {cohort.end_date || '—'}
								{#if cohort.sprints_count}
									· {cohort.sprints_count} sprints
								{/if}
							</div>
						</CardHeader>
						<CardBody>
							{#if (slotsByCohort[cohort.id] || []).length === 0}
								<p class="text-muted mb-0">No open slots right now.</p>
							{:else}
								<ul class="slot-list">
									{#each slotsByCohort[cohort.id] as slot (slot.id)}
										<li>
											<div>
												<span class="occ">{slot.occupation_title || 'Occupation'}</span>
												<span class="badge-open">Open</span>
											</div>
											<Button
												color="primary"
												size="sm"
												disabled={applyingId === slot.id}
												on:click={() => applyToSlot(slot)}
											>
												{applyingId === slot.id ? 'Applying…' : 'Apply'}
											</Button>
										</li>
									{/each}
								</ul>
							{/if}
						</CardBody>
					</Card>
				{/each}
			</div>
		{/if}
	</Container>
</div>

<style>
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
	}
	.page-head {
		margin-bottom: 1.5rem;
	}
	.page-head h1 {
		margin: 0 0 0.35rem;
		font-size: 1.6rem;
	}
	.page-head p {
		margin: 0;
		color: #556;
	}
	.signed-out {
		padding: 1.5rem;
		text-align: center;
		color: #666;
	}
	.cohort-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.cohort-card :global(.card-header) {
		background: #f7faf9;
	}
	.meta {
		margin-top: 0.35rem;
		font-size: 0.85rem;
		color: #667;
	}
	.slot-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.slot-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e8eeee;
	}
	.slot-list li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	.occ {
		font-weight: 600;
		margin-right: 0.5rem;
	}
	.badge-open {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #2e7d32;
		background: #e8f5e9;
		padding: 0.15rem 0.45rem;
		border-radius: 3px;
	}
</style>
