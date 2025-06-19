<script>
	import { slide } from 'svelte/transition';
	import API from '$lib/api/api';
	import { hookedOn, hookTied } from './quest-store';

	export let questStepId;
	export let makeNewStepFromChoice = () => {};
	let choices = [];
	let newChoice = {
		body: '',
		status: false,
		position: 1
	};
	let loading = true;
	let error = null;

	$: {
		if ($hookTied) {
			const choice = choices.find((c) => c.id === $hookedOn?.id);
			if (choice) {
				hookTiedToNextStep(choice);
			}
		}
	}

	async function hookTiedToNextStep(choice) {
		const res = await API.put(`/quest_step_choices/${choice.id}`, {
			next_step_id: $hookTied
		});
		console.log('res', res);

		choices = choices.map((c) => (c.id === choice.id ? res : c));
		hookedOn.set(null);
		hookTied.set(null);
	}

	async function loadChoices() {
		try {
			loading = true;
			const response = await API.get(`/quest_steps/${questStepId}/quest_step_choices`);
			choices = response;
			loading = false;
		} catch (e) {
			error = 'Failed to load choices';
			loading = false;
		}
	}

	async function createChoice() {
		try {
			if (!newChoice.body.trim()) return;

			const response = await API.post(`/quest_steps/${questStepId}/quest_step_choices`, {
				quest_step_choice: newChoice
			});

			choices = [...choices, response];
			newChoice = {
				body: '',
				status: false,
				position: choices.length + 1
			};
		} catch (e) {
			error = 'Failed to create choice';
		}
	}

	async function updateChoice(choice) {
		try {
			await API.put(`/quest_steps/${questStepId}/quest_step_choices/${choice.id}`, {
				quest_step_choice: choice
			});
			choices = choices.map((c) => (c.id === choice.id ? choice : c));
		} catch (e) {
			error = 'Failed to update choice';
		}
	}

	async function deleteChoice(choiceId) {
		try {
			await API.delete(`/quest_steps/${questStepId}/quest_step_choices/${choiceId}`);
			choices = choices.filter((c) => c.id !== choiceId);
		} catch (e) {
			error = 'Failed to delete choice';
		}
	}

	$: {
		if (questStepId) {
			loadChoices();
		}
	}
</script>

<div class="quest-step-choices">
	{#if loading}
		<div class="text-center">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else}
		{#if error}
			<div class="alert alert-danger" role="alert">
				{error}
			</div>
		{/if}

		<div class="choices-list mb-4">
			{#each choices as choice (choice.id)}
				<div class="choice-item" transition:slide>
					<div class="input-group mb-2">
						<button class="btn btn-outline-danger" on:click={() => deleteChoice(choice.id)}>
							×
						</button>
						<input
							type="text"
							class="form-control"
							bind:value={choice.body}
							on:blur={() => updateChoice(choice)}
							placeholder="Enter choice text"
						/>
						<div class="input-group-append">
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button
								class="btn btn-outline-secondary"
								class:btn-warning={$hookedOn && $hookedOn.id === choice.id}
								class:btn-success={choice.next_step_id}
								title="Link to next step"
								on:click={() => {
									$hookedOn && $hookedOn.id === choice.id
										? ($hookedOn = null)
										: ($hookedOn = choice);
								}}
							>
								<i class="fa fa-link"></i>
							</button>
							{#if !choices.some((c) => c.next_step_id)}
								{#if $hookedOn?.id !== choice.id}
									<button
										class="btn {choice.status ? 'btn-success' : 'btn-outline-success'}"
										on:click={() => updateChoice({ ...choice, status: !choice.status })}
										title={choice.status ? 'Correct answer' : 'Wrong answer'}
									>
										{choice.status ? '✓' : '✗'}
									</button>
								{/if}
							{/if}
							{#if $hookedOn && $hookedOn.id === choice.id && !choice.next_step_id}
								<button
									class="btn btn-outline-primary"
									on:click={() => makeNewStepFromChoice(choice)}
								>
									<i class="fa fa-upload"></i>
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="new-choice">
			<div class="input-group">
				<input
					type="text"
					class="form-control"
					bind:value={newChoice.body}
					placeholder="Add a new choice"
					on:keydown={(e) => e.key === 'Enter' && createChoice()}
				/>
				<div class="input-group-append">
					<button
						class="btn btn-outline-success"
						on:click={() => (newChoice.status = !newChoice.status)}
						title={newChoice.status ? 'Correct answer' : 'Wrong answer'}
					>
						{newChoice.status ? '✓' : '✗'}
					</button>
					<button class="btn btn-primary" on:click={createChoice}> Add </button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.quest-step-choices {
		padding: 1rem;
	}

	.choice-item {
		margin-bottom: 0.5rem;
	}

	.choice-item:hover {
		background-color: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
	}

	.new-choice {
		margin-top: 1rem;
	}
</style>
