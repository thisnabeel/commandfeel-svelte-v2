<script>
	import Api from '$lib/api/api';
	import Language from '$lib/components/Languages/Language.svelte';
	import { onMount } from 'svelte';
	import CodeCompiler from '$lib/components/CodeCompiler/Box.svelte';
	import debounce from '$lib/functions/debounce';
	import { user } from '$lib/stores/user';
	export let trait;

	let languages = [];
	onMount(async () => {
		languages = await Api.get('/programming_languages.json');
		console.log({ trait });
	});

	async function updateCode(value, language) {
		// console.log(value);
		const response = await debounce(
			'/programming_language_traits.json',
			{
				programming_language_id: language.id,
				trait_id: trait.id,
				body: value
			},
			'post'
		);
		// console.log(response);
	}

	$: filteredLanguages =
		$user && $user.admin
			? languages
			: languages.filter((l) =>
					trait.programming_language_traits.map((p) => p.programming_language_id).includes(l.id)
			  );
</script>

{#if languages}
	<div class="jumbotron">
		<h1>{trait.title}</h1>
	</div>

	<ul class="clean-list languages">
		{#each filteredLanguages as language}
			<Language {language}>
				<CodeCompiler {language} {updateCode} {trait} />
			</Language>
		{/each}
	</ul>
{/if}

<style>
	.jumbotron {
		padding: 24px;
		background-color: #fff;
	}
</style>
