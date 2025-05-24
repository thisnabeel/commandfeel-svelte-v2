<script>
	import Header from '$lib/header/Header.svelte';
	import '../app.css';
	import { Modals, modals } from 'svelte-modals';
	import { fade } from 'svelte/transition';
	import NavButtons from '$lib/nav-buttons/NavButtons.svelte';
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { csrf_token } from '$lib/stores/api.js';
	import { user } from '$lib/stores/user';
	import { currentPage, showGuideButton } from '$lib/stores/view';

	import GaragePopUp from '$lib/pop-ups/Garage.svelte';

	import { afterNavigate } from '$app/navigation';
	let user_signed_in;

	let csrf;
	onMount(async function () {
		// const csrfToken = document.querySelector('meta[name=csrf-token]').content;
		// console.log(csrfToken)
		// csrf = await Api.get('/generate_csrf');
		// csrf_token.set(csrf);
		showGuideButton.set(true);

		user.subscribe((value) => (user_signed_in = value));
		// console.log(csrf_token)
	});

	afterNavigate(() => {
		currentPage.set('');
	});
</script>

<svelte:head>
	<meta name="csrf-token" content={csrf} />
</svelte:head>

<main>
	<NavButtons />
	<Header />
	<slot />
</main>

<Modals>
	<div slot="backdrop" class="backdrop" transition:fade on:click={close} />
</Modals>

<!-- <GaragePopUp></GaragePopUp> -->

<!-- <footer>
	<p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>
</footer> -->
<style>
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
