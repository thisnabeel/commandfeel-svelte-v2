<script>
	import { user, credsView } from '$lib/stores/user';
	import CohortsIndex from '$lib/components/Cohorts/Index.svelte';
	import CohortsApply from '$lib/components/Cohorts/Apply.svelte';
</script>

<svelte:head>
	<title>Cohorts</title>
</svelte:head>

{#if $user?.admin}
	<CohortsIndex />
{:else if $user}
	<CohortsApply />
{:else}
	<div class="gate">
		<p>Sign in to browse open cohort seats and apply.</p>
		<button type="button" on:click={() => credsView.set('signIn')}>Sign in</button>
	</div>
{/if}

<style>
	.gate {
		padding: 2.5rem 1.5rem;
		text-align: center;
		color: #555;
	}
	.gate button {
		margin-top: 0.75rem;
		padding: 0.55rem 1.1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: #fff;
		cursor: pointer;
		font-weight: 600;
	}
	.gate button:hover {
		background: #f5f5f5;
	}
</style>
