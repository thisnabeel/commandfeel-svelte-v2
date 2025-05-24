<script>
	import { onMount } from 'svelte';
	import { skills } from '$lib/stores/main.js';
	import { modals } from 'svelte-modals';
	import SkillModal from '$lib/modals/videos/skill.svelte';
	import PopularWonders from './PopularWonders/PopularWonders.svelte';

	let abstractions;
	onMount(async function () {
		skills.subscribe((value) => {
			abstractions = value.filter(
				(skill) =>
					skill.abstractions &&
					skill.abstractions.filter((a) => a.preview && a.preview.length > 1).length
			);
			const count = 6;
			abstractions = abstractions.sort(() => 0.5 - Math.random()).slice(0, count);
			console.log(abstractions);
		});
	});

	function openSkillVideo(skill, abstraction) {
		modals.open(SkillModal, { skill: skill, abstraction: abstraction });
	}

	function visitSkill(item) {
		window.location = '/skills/' + item.slug;
	}
</script>

<section class="masonry-container">
	{#if abstractions}
		{#each abstractions as item}
			<div class="masonry-item">
				<article class="skill">
					<img
						class="preview"
						on:click={openSkillVideo(item, item.abstractions[0])}
						src={item.abstractions[0].preview}
						alt=""
					/>
					<div class="title">
						<a href="/skills/{item.slug}" class="clean-a">
							{item.title}
						</a>
					</div>
				</article>
			</div>
		{/each}
	{/if}
</section>

<PopularWonders></PopularWonders>

<style>
	.masonry-container {
		padding: 30px;
		columns: 2 200px;
		column-gap: 0.5rem;
		width: 100%;
		margin: 0 auto;
	}

	.masonry-item {
		position: relative;
	}

	.masonry-container > div {
		width: 100%;
		padding: 10px;
		margin: 10px;
		margin: 0 1.5rem 1.5rem 0;
		display: inline-block;
		border: solid 2px transparent;
		border-radius: 5px;
		transition: all 0.25s ease-in-out;
	}

	article {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		text-align: center;
	}

	.preview {
		text-align: center;
		display: block;
		margin: 0 auto;
		width: 100%;
	}

	.title {
		padding-top: 20px;
		font-size: 22px;
	}
</style>
