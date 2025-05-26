<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import { credsView } from '$lib/stores/user';
	import Swal from 'sweetalert2';
	import { goto } from '$app/navigation';

	let quests = [];
	let loading = true;

	onMount(async () => {
		let url = '/quests/popular';
		if ($user?.admin) {
			url = '/quests/popular?admin=true';
		}
		try {
			const response = await Api.get(url);
			console.log('popular quests', response);
			quests = response;
		} finally {
			loading = false;
		}
	});

	async function handleQuestClick(questId) {
		if (!$user) {
			const result = await Swal.fire({
				title: 'Quick Sign Up Required',
				text: 'Sign up for free in seconds to start playing this quest!',
				icon: 'info',
				showCancelButton: true,
				confirmButtonText: 'Sign Up',
				cancelButtonText: 'Maybe Later',
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33'
			});

			if (result.isConfirmed) {
				credsView.set('signUp');
			}
		} else {
			goto(`/quests/${questId}/play`);
		}
	}

	$: filteredQuests = $user?.admin
		? quests
		: quests.filter((item) => item.cover || item.steps.find((s) => s.image_url));
</script>

{#if loading}
	<div class="loading-container">
		<p class="loading-text">Loading Interactive Quests...</p>
	</div>
{:else if filteredQuests.length > 0}
	<div class="masonry-container">
		{#each filteredQuests as item}
			<div class="box">
				<button class="quest-button clean-a" on:click={() => handleQuestClick(item.id)}>
					<img
						class="cover"
						src={item.cover || item.steps.find((s) => s.image_url)?.image_url}
						alt="cover image"
					/>
					<!-- <span class="objective">
						<span class="english">{item.title}</span>
					</span> -->
					<span class="in-lang">
						<i class="fa fa-compass" aria-hidden="true" />
						{item.questable.title}
					</span>
				</button>
				{#if $user && $user.admin}
					<a href="/quests/{item.id}/edit" class="btn btn-block btn-warning">Edit</a>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.cover {
		width: 100%;
		border-radius: 10px 10px 0 0;
		object-fit: cover;
		max-height: 200px;
	}

	.objective {
		background: #ffd1bc;
		display: block;
		font-size: 24px;
		border-radius: 0;
		font-family: 'GreycliffCF-Regular';
	}

	.english {
		padding: 20px;
		display: block;
		font-weight: bold;
	}

	.in-lang {
		background: linear-gradient(to right, #de208826, #007bfe00);
		box-shadow: 1px 0px 20px 3px rgb(46 244 154 / 23%);
		padding: 8px 0px;
		font-size: 20px;
		text-align: center;
		display: block;
	}

	.masonry-container {
		-webkit-columns: 2 200px;
		-moz-columns: 2 200px;
		columns: 3 200px;
		-webkit-column-gap: 1.5rem;
		-moz-column-gap: 1.5rem;
		column-gap: 0.5rem;
		width: 100%;
		margin: 0 auto;
	}

	.box {
		width: 100%;
		margin: 0 1.5rem 1.5rem 0;
		display: inline-block;
		border: solid 2px transparent;
		border-radius: 10px 10px 0 0;
		transition: all 0.25s ease-in-out;
		background: white;
	}

	.clean-a {
		text-decoration: none;
		color: inherit;
	}

	.btn-block {
		display: block;
		width: 100%;
	}

	.btn-warning {
		color: #000;
		background-color: #ffc107;
		border-color: #ffc107;
	}

	.quest-button {
		width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		display: block;
	}

	.quest-button:hover {
		transform: translateY(-2px);
		transition: transform 0.2s ease;
	}
</style>
