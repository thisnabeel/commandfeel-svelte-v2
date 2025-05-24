<script>
	import { user } from '$lib/stores/user';
	import Button from './Button.svelte';
	import Api from '$lib/api/api';
	import CredsPopUp from './creds/Creds.svelte';
	import MediaQuery from '$lib/MediaQuery/MediaQuery.svelte';
	import { showGuide } from '$lib/stores/view';

	let btn;

	let user_signed_in;
	user.subscribe((value) => (user_signed_in = value));

	const sign_out = async () => {
		const response = await Api.get('/users/sign_out.json');
		console.log('sign out', response);
		user.set(null);
	};

	let showSettings = false;
	let showLogIn = false;
</script>

<aside class="user">
	{#if user_signed_in}
		<span on:click={() => (showSettings = !showSettings)}>
			<Button icon="fa-user" />
		</span>

		{#if showSettings}
			<!-- <span class="settings" >
                <Button icon="fa-cog" href="/users/settings" bg="#97B1FF"></Button>
            </span> -->

			<span class="sign-out" on:click={sign_out}>
				<Button icon="fa-sign-out" bg="#000" />
			</span>
		{/if}
	{:else}
		<span on:click={() => (showLogIn = !showLogIn)}>
			<Button icon="fa-user" />
		</span>

		{#if $showGuide && !showLogIn}
			<div class="guide user">
				<i class="fa fa-arrow-up" /> Sign In/Up here
			</div>
		{/if}
		{#if showLogIn}
			<div class="creds-pop">
				<CredsPopUp hidePopUp={() => (showLogIn = !showLogIn)} />
			</div>
		{/if}
	{/if}
</aside>

<style>
	.creds-pop {
		position: absolute;
		width: 240px;
		z-index: 9999;
		cursor: auto;
		right: -120px;
		top: 30px;
	}
	aside {
		cursor: pointer;
		position: absolute;
	}
	.user {
		top: 40px;
		right: 145px;
		z-index: 999;
	}

	.settings {
		left: -66px;
		position: absolute;
	}

	.settings :global(.fa) {
		color: #fff !important;
	}

	.sign-out {
		left: -66px;
		/* left: -136px; */
		position: absolute;
		z-index: 9999999;
	}

	:global(.sign-out) {
		color: #97b1ff;
	}

	.guide.user {
		width: 63px;
		position: fixed;
		top: 100px;
		right: 90px;
		z-index: 999;
		text-align: center;
	}

	@media (max-width: 480px) {
		.user {
			right: 65px;
			top: 25px;
			z-index: 999;
		}

		.guide.user {
			width: 63px;
			position: fixed;
			top: 81px;
			right: 10px;
			z-index: 999;
			text-align: center;
		}

		.creds-pop {
			right: -3.5em;
		}
	}
</style>
