<script>
	import Header from '$lib/header/Header.svelte';
	import '../app.css';
	import { Modals, modals } from 'svelte-modals';
	import { fade } from 'svelte/transition';
	import NavButtons from '$lib/nav-buttons/NavButtons.svelte';
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { csrf_token } from '$lib/stores/api.js';
	import { credsView, user } from '$lib/stores/user';
	import { currentPage, showGuideButton, layoutClass, showGuide } from '$lib/stores/view';
	import NameRequiredModal from '$lib/components/User/NameRequiredModal.svelte';
	import { loadFeatureFlags, showGuideFlag } from '$lib/stores/featureFlags';

	import GaragePopUp from '$lib/pop-ups/Garage.svelte';

	import { afterNavigate } from '$app/navigation';
	let user_signed_in;

	let csrf;

	function needsName(u) {
		if (!u) return false;
		if (typeof u.name_complete === 'boolean') return !u.name_complete;
		return !(u.first_name || '').trim() || !(u.last_name || '').trim();
	}

	$: nameGateOpen = needsName($user);

	onMount(async function () {
		await loadFeatureFlags();
		showGuideButton.set($showGuideFlag);
		if (!$showGuideFlag) {
			showGuide.set(false);
		}
		if (window.location.pathname.includes('/quests/')) {
			layoutClass.set('questView');
		}

		user.subscribe((value) => (user_signed_in = value));
	});

	afterNavigate(() => {
		currentPage.set('');
	});
</script>

<svelte:head>
	<meta name="csrf-token" content={csrf} />
</svelte:head>

<NavButtons />
<main class={$layoutClass} class:dimmed={$credsView || nameGateOpen} class:locked={nameGateOpen}>
	<Header />
	<slot />
</main>

{#if nameGateOpen}
	<NameRequiredModal />
{/if}

<Modals>
	<div slot="backdrop" class="backdrop" transition:fade on:click={close} />
</Modals>

<!-- <GaragePopUp></GaragePopUp> -->

<!-- <footer>
	<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>
</footer> -->
<style>
	.dimmed {
		filter: blur(10px);
		transition: all 0.3s ease;
		/* background: rgba(0, 0, 0, 0.7); */
	}
	main.locked {
		pointer-events: none;
		user-select: none;
	}
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		/* padding: 1rem; */
		width: 100%;
		max-width: 1024px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 40px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 40px 0;
		}
	}
</style>
