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
	import ImageUploader from './ImageUploader.svelte';

	export let isOpen;
	let closable = true;
	const handleOutsideClick = () => {
		if (closable) {
			modals.closeAll();
		}
	};
</script>

{#if isOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div role="dialog" class="modal" on:click|stopPropagation>
		<div class="barrier" on:click|stopPropagation>
			<OutClick on:outclick={handleOutsideClick}>
				<div class="contents">
					<ImageUploader />
				</div>
			</OutClick>
		</div>
	</div>
{/if}

<style>
	.contents {
		padding: 1em;
		border-radius: 8px;
	}
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
