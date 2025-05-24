<script>
	import Api from '$lib/api/api';
	import Language from './Language.svelte';
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user';
	import { loomifiedView, showGuide } from '$lib/stores/view';

	import { modals } from 'svelte-modals';
	import GuideModal from '$lib/modals/guide/Modal.svelte';

	export let algorithm;
	export let progress;
	let languages = [];
	onMount(async () => {
		languages = await Api.get('/programming_languages.json');
	});

	$: filteredLanguages =
		$user && $user.admin
			? languages
			: languages.filter((l) =>
					algorithm.language_algorithm_starters.map((s) => s.programming_language_id).includes(l.id)
				);

	let loomified = -1;
	function loomify(payload) {
		if (loomified > -1) {
			loomified = -1;
			loomifiedView.set(false);
			return;
		}
		loomified = payload;
		loomifiedView.set(true);
	}
</script>

<!-- {#if $showGuide && !$loomifiedView}
	<div class="flex">
		<div
			class="btn btn-lg btn-danger"
			on:click={() => {
				modals.open(GuideModal, { slug: 'algorithm page: never programmed before' });
			}}
		>
			I have never programmed before!
		</div>
		<div
			class="btn btn-lg btn-info"
			on:click={() => {
				modals.open(GuideModal, { slug: 'algorithm page: can program, new to commandfeel' });
			}}
		>
			I can program, show me the algorithms.
		</div>
	</div>
{/if} -->

{#if languages}
	<ul class="clean-list languages" class:loomified={loomified > -1}>
		{#if loomified > -1}
			<Language
				language={languages.filter((l) => l.id === loomified)[0]}
				{algorithm}
				{progress}
				{loomify}
				{loomified}
			/>
		{:else}
			{#each filteredLanguages as language, index}
				<Language {language} {algorithm} {progress} {loomify} {loomified} {index} />
			{/each}
		{/if}
	</ul>
{/if}

<style>
	.loomified {
		margin: 290px 0;
	}

	.flex {
		display: flex;
	}
	.flex div {
		flex: 1 1 50%;
		padding: 20px 0;
	}
</style>
