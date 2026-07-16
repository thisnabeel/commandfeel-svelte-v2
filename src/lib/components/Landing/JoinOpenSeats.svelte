<script>
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';

	/** Called with the claimed seat after a successful join */
	export let onJoined = (_seat) => {};

	let cohorts = [];
	/** @type {Record<number|string, any[]>} */
	let slotsByCohort = {};
	let loading = true;
	let error = '';
	/** @type {number|string|null} */
	let joiningId = null;

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

	function formatRange(start, end) {
		if (!start && !end) return null;
		try {
			const opts = { month: 'short', day: 'numeric', year: 'numeric' };
			const a = start ? new Date(start).toLocaleDateString(undefined, opts) : '—';
			const b = end ? new Date(end).toLocaleDateString(undefined, opts) : '—';
			return `${a} – ${b}`;
		} catch {
			return [start, end].filter(Boolean).join(' – ');
		}
	}

	async function load() {
		if (!$user) {
			cohorts = [];
			slotsByCohort = {};
			loading = false;
			return;
		}
		try {
			loading = true;
			error = '';
			const list = await Api.get('/cohorts');
			cohorts = Array.isArray(list) ? list : [];
			const results = await Promise.all(
				cohorts.map(async (c) => {
					const slots = await Api.get(`/cohort_users?cohort_id=${c.id}`);
					return [c.id, Array.isArray(slots) ? slots : []];
				})
			);
			slotsByCohort = Object.fromEntries(results);
		} catch (err) {
			error = apiError(err, 'Failed to load open seats');
			cohorts = [];
			slotsByCohort = {};
		} finally {
			loading = false;
		}
	}

	async function joinSlot(slot) {
		if (!slot?.id || joiningId) return;
		try {
			joiningId = slot.id;
			error = '';
			const seat = await Api.post(`/cohort_users/${slot.id}/apply`, {});
			onJoined(seat);
		} catch (err) {
			error = apiError(err, 'Could not join this seat');
			joiningId = null;
			// Refresh open list in case the seat was taken
			await load();
		}
	}

	$: openRows = cohorts
		.map((c) => ({
			cohort: c,
			slots: slotsByCohort[c.id] || []
		}))
		.filter((row) => row.slots.length > 0);

	$: totalOpen = openRows.reduce((n, row) => n + row.slots.length, 0);

	let lastUserId = undefined;
	$: {
		const id = $user?.id ?? null;
		if (id !== lastUserId) {
			lastUserId = id;
			load();
		}
	}
</script>

<div class="join-panel">
	<header class="head">
		<p class="kicker">Get started</p>
		<h2>Join a cohort</h2>
		<p class="lede">
			Pick an open occupation seat. These are roles that don’t have a learner yet.
		</p>
	</header>

	{#if error}
		<p class="err" role="alert">{error}</p>
	{/if}

	{#if loading}
		<p class="status">Loading open seats…</p>
	{:else if totalOpen === 0}
		<p class="status">
			No open seats right now. Check back soon, or ask your program lead to add a seat for you.
		</p>
	{:else}
		<ul class="cohorts">
			{#each openRows as row (row.cohort.id)}
				<li class="cohort">
					<div class="cohort-head">
						<h3>{row.cohort.title || 'Cohort'}</h3>
						{#if row.cohort.subtitle}
							<p class="sub">{row.cohort.subtitle}</p>
						{/if}
						{#if formatRange(row.cohort.start_date, row.cohort.end_date)}
							<p class="dates">{formatRange(row.cohort.start_date, row.cohort.end_date)}</p>
						{/if}
					</div>
					<ul class="slots">
						{#each row.slots as slot (slot.id)}
							<li class="slot">
								<div class="slot-copy">
									<span class="occ">{slot.occupation_title || 'Occupation'}</span>
									<span class="pill">Open</span>
								</div>
								<button
									type="button"
									class="join"
									disabled={joiningId === slot.id}
									on:click={() => joinSlot(slot)}
								>
									{joiningId === slot.id ? 'Joining…' : 'Join'}
								</button>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.join-panel {
		margin-top: 1.15rem;
		background: #fff;
		border: 1px solid rgba(7, 65, 68, 0.12);
		border-radius: 16px;
		padding: 1.35rem 1.25rem 1.25rem;
		box-shadow: 0 10px 30px rgba(7, 65, 68, 0.06);
	}

	.head {
		margin-bottom: 1.1rem;
	}

	.kicker {
		margin: 0 0 0.25rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #0a5f63;
	}

	h2 {
		margin: 0 0 0.35rem;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: #071416;
	}

	.lede {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.45;
		color: #3a545c;
	}

	.cohorts {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.cohort {
		border: 1px solid rgba(7, 65, 68, 0.1);
		border-radius: 12px;
		overflow: hidden;
		background: #f8fbfb;
	}

	.cohort-head {
		padding: 0.85rem 1rem 0.55rem;
		background: #fff;
		border-bottom: 1px solid rgba(7, 65, 68, 0.08);
	}

	.cohort-head h3 {
		margin: 0;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #071416;
	}

	.sub,
	.dates {
		margin: 0.2rem 0 0;
		font-size: 0.82rem;
		color: #5a7178;
	}

	.slots {
		list-style: none;
		margin: 0;
		padding: 0.35rem 0.65rem 0.65rem;
	}

	.slot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.65rem 0.45rem;
		border-bottom: 1px solid rgba(7, 65, 68, 0.08);
	}

	.slot:last-child {
		border-bottom: none;
	}

	.slot-copy {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4rem;
		min-width: 0;
	}

	.occ {
		font-weight: 700;
		font-size: 0.95rem;
		color: #071416;
	}

	.pill {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #15803d;
		background: #dcfce7;
		padding: 0.12rem 0.4rem;
		border-radius: 999px;
	}

	.join {
		flex-shrink: 0;
		border: none;
		border-radius: 999px;
		padding: 0.4rem 0.95rem;
		background: #0a5f63;
		color: #fff;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.join:hover:not(:disabled) {
		background: #084b4e;
	}

	.join:disabled {
		opacity: 0.65;
		cursor: wait;
	}

	.status {
		margin: 0;
		font-size: 0.92rem;
		color: #3a545c;
		line-height: 1.45;
	}

	.err {
		margin: 0 0 0.75rem;
		font-size: 0.9rem;
		color: #b02a37;
	}
</style>
