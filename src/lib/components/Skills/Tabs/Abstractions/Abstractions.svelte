<script>
	export let skill;
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';

	import Abstraction from './Abstraction.svelte';

	import Api from '$lib/api/api';
	import Swal from 'sweetalert2';
	import API from '$lib/api/api';
	async function handleRemoveAbstraction(payload) {
		console.log({ payload });
		await Api.delete('/abstractions/' + payload.id + '.json');
		skill.abstractions = skill.abstractions.filter((s) => s.id !== payload.id);
	}

	const addAbstraction = async () => {
		const response = await Api.post('/abstractions.json', {
			abstractable_id: skill.id,
			abstractable_type: 'Skill'
		});
		console.log(response);
		skill.abstractions = [...skill.abstractions, response];
		// console.log('fetch skill', skill);
		// fetchSkill(skill.id);
	};

	const generateAbstraction = async () => {
		const response = await Api.post('/skills/generate_abstraction.json', {
			id: skill.id
		});

		skill.abstractions = [...skill.abstractions, response];
	};

	async function createQuest(abstraction) {
		try {
			const { value: title } = await Swal.fire({
				title: 'Enter Quest Title',
				input: 'text',
				inputPlaceholder: 'Enter the title for your quest...',
				showCancelButton: true,
				inputValidator: (value) => {
					if (!value) {
						return 'You need to write something!';
					}
				}
			});

			if (!title) return; // User cancelled or closed the dialog

			Swal.fire('Building Quest...');

			const quest = await API.post(`/skills/${skill.id}/quests`, {
				title: title,
				description: `a ${title} adventure`,
				position: 0,
				skill_id: skill.id,
				image_url: '',
				difficulty: 1
			});

			try {
				await API.post(`/quests/${quest.id}/quest_wizard`, {
					level: 'beginner',
					abstraction: abstraction.body
				});
				await Swal.fire({
					icon: 'success',
					title: 'Quest Created!',
					text: 'Your quest is now ready to play',
					showCancelButton: true,
					confirmButtonText: 'Play Now',
					cancelButtonText: 'Close',
					confirmButtonColor: '#28a745'
				}).then((result) => {
					if (result.isConfirmed) {
						goto(`/quests/${quest.id}/play`);
					}
				});
			} catch (err) {
				const error = err.message || 'Failed to generate quest steps';
				await Swal.fire({
					icon: 'error',
					title: 'Oops...',
					text: error
				});
			}
			return quest;
		} catch (err) {
			const error = err.message || 'An error occurred while creating quest';
			console.log('error', error);
		}
	}
	async function makeQuestFromAbstraction(abstraction) {
		console.log('makeQuestFromAbstraction', abstraction);
		Swal.fire('Building Quest...');
		createQuest(abstraction);
	}

	let requested = false;
</script>

<ul class="abstractions">
	{#if $user && $user.admin}
		<div class="adder">
			<div class="add-abstraction" on:click={addAbstraction}>+</div>
			<div class="btn btn-warning generate-abstraction" on:click={generateAbstraction}>
				<i class="fa fa-bolt" />
			</div>
		</div>
	{/if}
	{#if skill.abstractions.length > 0}
		{#each skill.abstractions as abstraction}
			<li>
				<Abstraction
					{skill}
					{abstraction}
					user={$user}
					removeAbstraction={handleRemoveAbstraction}
					{makeQuestFromAbstraction}
				/>
			</li>
		{/each}
	{:else}
		<div class="cta">
			<h1>No Abstractions Yet.</h1>
			<br />
			{#if !requested}
				<div class="btn btn-warning" on:click={() => (requested = true)}>Request Abstraction</div>
			{:else}
				<div class="requested">
					Thank You for requesting.<br /> Our team will start simplifying this concept soon.
				</div>
			{/if}
		</div>
	{/if}
</ul>

<style>
	.cta {
		background: rgb(207, 41, 41);
		color: #fff;
		display: block;
		padding: 3em;
		border-radius: 8px;
	}

	.cta .btn {
		display: block;
		font-size: 22px;
	}

	.cta h1 {
		color: #fff;
	}
	.adder {
		font-size: 72px;
		position: absolute;
		left: 35%;
		/* display: inline; */
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
		display: -webkit-inline-box;
	}
	/* 
	.add-abstraction {
		font-size: 72px;
		position: absolute;
		right: 50%;
		display: inline;
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
	} */

	.tab {
		padding: 14px;
	}
	.tab.active {
		background-color: #000;
		color: #fff;
	}
	.flex {
		display: flex;
	}

	.flex > div {
		flex: 1 1 33%;
		text-align: center;
	}

	.title {
		padding: 40px 0px;
	}
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		position: relative;
	}

	.abstractions {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		width: 70%;
		margin: 0 auto;
		padding: 20px 0;
	}

	@media (max-width: 480px) {
		.abstractions {
			width: 100%;
		}
	}
</style>
