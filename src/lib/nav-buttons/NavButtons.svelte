<script>
	import Button from './Button.svelte';
	import MediaQuery from '$lib/MediaQuery/MediaQuery.svelte';
	import { garage } from '$lib/stores/pop-ups';
	import { user } from '$lib/stores/user';

	import User from './User.svelte';
	import Guide from './Guide.svelte';
	import { loomifiedView, showMobileMenu, currentPage, globalViewCategory } from '$lib/stores/view';
	import { goto } from '$app/navigation';

	const openGaragePopUp = () => {
		garage.set(true);
	};

	function visit(link) {
		showMobileMenu.set(false);
		goto(link);
	}

	$: username = $user ? $user.username : 'demo';
</script>

{#if !$showMobileMenu}
	<!-- {#if matches} -->
	{#if !$loomifiedView}
		<User />
		<Guide />

		{#if $user && $user.admin}
			<!-- <aside class="news hide-mobile" on:click={() => goto('/control_panel')}>
				<div class="btn btn-warning">Control Panel</div>
			</aside> -->
		{/if}
	{/if}
	<div class="fa fa-bars show-menu" on:click={() => showMobileMenu.set(true)} />
{:else}
	<div class="mobileMenu">
		<div class="close-menu" on:click={() => showMobileMenu.set(false)}>
			<i class="fa fa-times" />
		</div>

		<ul class="links clean-list">
			{#if $user && $user.admin}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<li class="control_panel" on:click={() => visit('/control_panel')}>Control Panel</li>
			{/if}
			<li on:click={() => visit(`/`)}>Home</li>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li on:click={() => visit(`/cd/${username}`)} class:activeTab={$currentPage === 'portfolio'}>
				My Portfolio
			</li>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li
				on:click={() => {
					visit('/');
					globalViewCategory.set('Skills');
				}}
				class:activeTab={$currentPage === 'popQuiz'}
			>
				Pop Quiz
			</li>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li on:click={() => visit('/my_study_list')} class:activeTab={$currentPage === 'myStudyList'}>
				My Study List
			</li>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li on:click={() => visit('/my_jobs')} class:activeTab={$currentPage === 'myJobs'}>
				My Jobs
			</li>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<li on:click={() => visit('/algorithms')} class:activeTab={$currentPage === 'algorithms'}>
				Coding Challenges
			</li>

			<li on:click={() => visit('/tradeoffs')} class:activeTab={$currentPage === 'tradeoffs'}>
				Tradeoffs
			</li>
		</ul>
	</div>
{/if}

<!-- <aside class="book">
			<Button icon="fa-book" />
		</aside>

		<aside class="news">
			<Button icon="fa-newspaper" />
		</aside> -->

<!-- <aside class="garage" on:click={openGaragePopUp}>
        <Button img="/icons/garage.png" href={null} bg="#e53935"></Button>
    </aside> -->

<!-- {/if} -->
<style>
	.activeTab {
		background-color: purple;
	}

	.control_panel {
		color: rgb(235, 255, 108);
	}
	aside {
		cursor: pointer;
		position: absolute;
	}
	.user {
		top: 40px;
		right: 145px;
	}

	.book {
		top: 40px;
		right: 80px;
	}

	.news {
		top: 40px;
		left: 28px;
	}

	.garage {
		bottom: 80px;
		left: 28px;
	}

	.garage :global(img) {
		width: 30px;
		top: 13px;
		left: 10px;
	}

	.show-menu {
		position: fixed;
		top: 24px;
		left: 14px;
		font-size: 34px;
		z-index: 999;
		background: #fff;
		padding: 10px;
		border-radius: 4px;
		color: #97b1ff;
		/* display: block; */
		/* display: none; */
	}

	.mobileMenu {
		display: block;
		position: fixed;
		left: 0;
		width: 20vw;
		height: 100vh;
		background: #000;
		z-index: 99999;
	}

	.close-menu {
		position: absolute;
		top: 10px;
		left: 18px;
		color: #fff;
		font-size: 34px;
	}

	.mobileMenu .links {
		margin-top: 70px;
		/* padding: 1em; */
		color: #fff;
	}

	.links li {
		padding: 1em;
		font-size: 24px;
		border-bottom: 1px solid #4d4d4d;
	}

	.links li:hover {
		background: rgb(53, 53, 53);
	}

	@media (max-width: 480px) {
		.show-menu {
			position: fixed;
			top: 24px;
			left: 14px;
			font-size: 34px;
			z-index: 999;
			background: #fff;
			padding: 10px;
			border-radius: 4px;
			color: #97b1ff;
			/* display: block; */
			/* display: none; */
		}

		.hide-mobile {
			display: none;
		}

		.mobileMenu {
			display: block;
			position: fixed;
			width: 100vw;
			height: 100vh;
			background: #000;
			z-index: 99999;
		}
	}
</style>
