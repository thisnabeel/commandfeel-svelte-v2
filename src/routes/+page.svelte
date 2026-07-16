<script>
	import Api from '$lib/api/api.js';
	import PopularQuestsSampler from '$lib/components/Quests/PopularQuestsSampler.svelte';
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
			memberships = await Api.get('/cohort_users/mine');
		} catch {
			memberships = [];
		} finally {
			membershipsLoaded = true;
		}
	}

	$: {
		const id = $user?.id ?? null;
		if (id !== lastUserId) {
			lastUserId = id;
			loadMemberships();
		}
	}

	$: inCohort = membershipsLoaded && memberships.length > 0;
</script>

<svelte:head>
	<title>The Software Engineering Gym</title>
	<meta name="description" content="commandfeel" />
</svelte:head>

{#if $user && inCohort}
	<CohortDashboard {memberships} />
{:else if $user && $user.admin}
	<PopularQuestsSampler />
{:else if membershipsLoaded}
	<CohortIntroCard />
{/if}
