<script>
	// @ts-nocheck

	import { modals } from 'svelte-modals';
	import { OutClick } from 'svelte-outclick';
	import { onMount } from 'svelte';
	import { onBeforeClose } from 'svelte-modals';
	import Swal from 'sweetalert2';
	import API from '$lib/api/api';
	import { user } from '$lib/stores/user';
	import ProofLink from '$lib/components/Proof/ProofLink/ProofLink.svelte';
	import Proof from '$lib/components/Proof/Proof.svelte';
	// provided by <Modals />
	export let isOpen;

	export let challenge;

	let proofs = [];

	// $: find(challenge);

	async function find() {
		proofs = await API.post('/proofs/find.json', {
			user_id: $user.id,
			challenge_id: challenge.id
		});
	}

	onMount(async function () {
		document.body.style['overflow-y'] = 'hidden';
		find();
	});

	onBeforeClose(() => {
		document.body.style['overflow-y'] = 'initial';
	});

	let closable = true;
	const handleOutsideClick = () => {
		if (closable) {
			modals.closeAll();
		}
	};

	let linkInput = '';
	let titleInput = '';
	let descriptionInput = '';

	async function addProof() {
		const check = [linkInput, titleInput, descriptionInput];
		for (let input of check) {
			if (input.length < 2) {
				closable = false;
				Swal.fire('Incomplete', 'Please fill in all the fields', 'error').then(() => {
					closable = true;
				});
				return;
			}
		}

		const res = await API.post('/proofs.json', {
			user_id: $user.id,
			title: titleInput,
			challenge_id: challenge.id,
			description: descriptionInput,
			proof_link: {
				url: 'https://github.com/thisnabeel/expressfeel-svelte'
			}
		});

		console.log({ res });

		proofs = [...proofs, res];

		linkInput = '';
		titleInput = '';
		descriptionInput = '';

		console.log({ proofs });
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div role="dialog" class="modal" on:click|stopPropagation>
		<div class="barrier" on:click|stopPropagation>
			<OutClick on:outclick={handleOutsideClick}>
				<div class="contents">
					<article>
						<div>
							<h2>Challenge:</h2>
							<h1>{challenge.title}</h1>

							<div class="form">
								<div class="url">
									<label for="">Project Title:</label>
									<input
										type="text"
										class="form-control"
										placeholder="Enter Title..."
										bind:value={titleInput}
									/>

									<label for="">Github/Youtube/Medium:</label>
									<small>You can add more links later as needed</small>
									<input
										type="text"
										class="form-control"
										placeholder="Enter Link..."
										bind:value={linkInput}
									/>

									<label for="">Project Description:</label>

									<textarea
										name=""
										id=""
										cols="30"
										rows="3"
										type="text"
										class="form-control"
										placeholder="Enter Description..."
										bind:value={descriptionInput}
									/>
									<div class="btn btn-outline-primary" on:click={addProof}>Add Proof</div>
								</div>
							</div>
						</div>

						<hr />
						<ul class="proofs clean-list">
							{#each proofs as proof}
								<Proof {proof} />
							{/each}
						</ul>
					</article>
				</div>
			</OutClick>
		</div>
	</div>
{/if}

<style>
	label {
		font-weight: bold;
		margin-top: 10px;
	}
	[role='dialog'] {
		background: rgba(0, 0, 0, 0.5);
	}

	.modal {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;

		/* allow click-through to backdrop */
		/* pointer-events: none; */
	}

	.contents {
		min-width: 240px;
		/* padding: 16px; */
		max-width: 750px;
		background: white;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: auto;
	}

	article {
		padding: 1em;
		width: 750px;
	}

	h2 {
		text-align: center;
		font-size: 24px;
	}

	p {
		text-align: center;
		margin-top: 16px;
	}

	.actions {
		margin-top: 32px;
		display: flex;
		justify-content: flex-end;
	}

	.title {
		background: #003eff;
		color: #fff;
		padding: 20px 30px;
		font-size: 30px;
	}

	.body {
		background-color: #041447;
		padding: 26px;
		border: 4px solid #013eff;
		font-size: 24px;
		font-family: 'GreyCliffCf-Medium';
		color: #fff;
		position: relative;
		text-align: left;
	}

	video {
		width: 100%;
		margin-bottom: -6px;
	}
</style>
