<script>
	import Api from '$lib/api/api.js';
	import CohortIntroCard from '$lib/components/Landing/CohortIntroCard.svelte';
	import CohortDashboard from '$lib/components/Landing/CohortDashboard.svelte';
	import { user } from '$lib/stores/user';

	let memberships = [];
	let membershipsLoaded = false;
	let lastUserId = undefined;

	async function loadMemberships() {
		if (!$user) {
			memberships = [];
			membershipsLoaded = true;
			return;
		}
		try {
			const list = await Api.get('/cohort_users/mine');
			memberships = Array.isArray(list) ? list : [];
		} catch {
			memberships = [];
		} finally {
			membershipsLoaded = true;
		}
	}

	async function onJoined(_seat) {
		await loadMemberships();
	}

	$: {
		const id = $user?.id ?? null;
		if (id !== lastUserId) {
			lastUserId = id;
			loadMemberships();
		}
	}

	$: signedInReady = !!$user && membershipsLoaded;
</script>

<svelte:head>
	<title>The Software Engineering Gym</title>
	<meta name="description" content="commandfeel" />
</svelte:head>

{#if signedInReady}
	<CohortDashboard {memberships} {onJoined} />
{:else if membershipsLoaded}
	<CohortIntroCard />
{/if}
