<script>
	import SkillsBar from './SkillsBar/SkillsBar.svelte';
	import LanguagesBar from './LanguagesBar/LanguagesBar.svelte';
	import Bar from './Bar.svelte';
	import { globalViewCategory, headerSubtitle } from '$lib/stores/view';
	import { modals } from 'svelte-modals';
	import TikTokModal from '$lib/modals/tiktok/Modal.svelte';
	import { user } from '$lib/stores/user';
	import { onMount, onDestroy } from 'svelte';

	function switchBar() {
		$globalViewCategory === 'Languages'
			? globalViewCategory.set('Skills')
			: globalViewCategory.set('Languages');
	}
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section class:hidden={!$user?.admin}>
	<i
		class="fa fa-flask"
		on:click={() => {
			modals.open(TikTokModal, {});
		}}
	/>

	<div class="bar">
		<span class="switcher" on:click={switchBar}>
			<div
				class="btn"
				class:btn-warning={$globalViewCategory === 'Skills'}
				class:btn-outline-warning={$globalViewCategory !== 'Skills'}
			>
				Architecture
			</div>
			<div
				class="btn"
				class:btn-primary={$globalViewCategory === 'Languages'}
				class:btn-outline-warning={$globalViewCategory !== 'Languages'}
			>
				Programming
			</div>
		</span>

		<div class:hidden={$globalViewCategory !== 'Skills'}>
			<SkillsBar />
		</div>
		<div class:hidden={$globalViewCategory !== 'Languages'}>
			<LanguagesBar />
		</div>
	</div>
</section>

<style>
	:global(.space-grotesk-heading) {
		font-family: 'Space Grotesk', sans-serif;
		font-optical-sizing: auto;
		font-weight: 700;
		font-style: normal;
		letter-spacing: -0.03em;
	}

	.cta-container {
		position: relative;
		padding: 1rem 1rem;
		/* background: linear-gradient(135deg, #20ffa2 0%, #0066ff 100%); */
		overflow: hidden;
		text-align: center;
		border-radius: 30px 30px;
		margin: 1em 0;
		/* box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); */
	}

	.cta-content {
		position: relative;
		z-index: 2;
		max-width: 800px;
		margin: 0 auto;
	}

	.cta-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(255,255,255,0.1)' fill-rule='evenodd'/%3E%3C/svg%3E");
		opacity: 0.5;
		z-index: 1;
	}

	h1 {
		color: rgb(2 73 106);
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
	}

	.cta-subtitle {
		color: rgb(2 73 106);
		font-size: 1.5rem;
		opacity: 0.9;
		margin: 0;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
	}

	.contents {
		width: 100vw;
		background: rgb(32, 255, 162);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: auto;
		padding: 0;
		border-radius: 14px;
	}

	.bar {
		position: relative;
	}

	.switcher {
		position: absolute;
		right: 15px;
		top: -45px;
		display: flex;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.cta-container {
			padding: 3rem 1rem;
		}

		h1 {
			font-size: 2.5rem;
			margin-bottom: 0.5rem;
		}

		.cta-subtitle {
			font-size: 1.2rem;
		}

		.switcher {
			position: absolute;
			right: 0;
			left: 50%;
			transform: translateX(-50%);
			top: -65px;
			width: 90%;
			max-width: 300px;
			display: flex;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.cta-container {
			padding: 1rem;
			padding-top: 0;
			margin-top: -3em;
			padding-bottom: 2rem;
		}

		h1 {
			font-size: 2rem;
		}

		.cta-subtitle {
			font-size: 1rem;
		}
	}
</style>
