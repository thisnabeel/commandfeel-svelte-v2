<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { selectSkill, skillsMap, wondersMap } from '$lib/stores/main';
	import Row from './Row.svelte';
	import { selectedSkill } from '$lib/stores/skills/mapper';
	import { listen } from 'svelte/internal';
	import sticky from '$lib/functions/sticky.js';

	let isStuck = false;
	let writing = false;

	function handleStuck(e) {
		isStuck = e.detail.isStuck;
	}

	let skills;
	let newSkillTitle = '';
	skillsMap.subscribe((value) => {
		console.log('skillsMap', value);
		skills = value;
	});

	onMount(() => {
		// Add event listener for arrow key presses
		window.addEventListener('keydown', move);
	});

	const findNode = (root, target) => {
		if (!root) {
			return null;
		}

		if (root.id === target.id) {
			return root;
		}

		for (let skill of root.skills) {
			const foundSkill = findNode(skill, target);
			if (foundSkill) {
				return foundSkill;
			}
		}

		return null;
	};

	const findParentNode = (root, target) => {
		if (!root) {
			return null;
		}
		if (!target) {
			return null;
		}
		if (root.id === target.skill_id) {
			return root;
		}

		for (let skill of root.skills) {
			const foundSkill = findParentNode(skill, target);
			if (foundSkill) {
				return foundSkill;
			}
		}

		return null;
	};

	async function addSkill() {
		if (newSkillTitle.length > 0) {
			if ($selectedSkill && $selectedSkill.id) {
				const clone = [...skills];

				const node = findNode(
					{
						id: -1,
						skills: clone
					},
					$selectedSkill
				);

				const response = await Api.post('/skills.json', {
					title: newSkillTitle,
					skill_id: $selectedSkill.id,
					position: node.skills.length + 1
				});

				node.skills = [...node.skills, response];

				console.log(clone);
				skills = clone;
			} else {
				const response = await Api.post('/skills.json', {
					title: newSkillTitle,
					position: skills.length + 1
				});
				skills = [...skills, response];
			}

			newSkillTitle = '';
		}
	}

	async function move(event) {
		if (!$selectedSkill) {
			return;
		}

		if ($selectedSkill && writing) {
			return;
		}
		let clone = [...skills];

		// console.log('skill', $selectedSkill);

		const node = findNode(
			{
				id: -1,
				skills: clone
			},
			$selectedSkill
		);

		const parentNode = findParentNode(
			{
				id: -1,
				skills: clone
			},
			$selectedSkill
		);

		const grandparentNode = findParentNode(
			{
				id: -1,
				skills: clone
			},
			parentNode
		);
		const index = $selectedSkill.position - 1;
		let newIndex = null;
		let element = null;

		let changed = [];

		switch (event.key) {
			case 'w':
				console.log('up');

				newIndex = index - 1;

				if (parentNode) {
					if (!parentNode.skills[newIndex]) {
						return;
					}

					element = parentNode.skills.splice(index, 1)[0];
					parentNode.skills.splice(newIndex, 0, element);
					changed = [...changed, parentNode];
				} else {
					element = clone.splice(index, 1)[0];
					clone.splice(newIndex, 0, element);
					changed = [...changed, null];
				}
				break;
			case 's':
				console.log('down');

				newIndex = index + 1;

				if (parentNode) {
					if (!parentNode.skills[newIndex]) {
						return;
					}
					// console.log(index, parentNode.skills[index]);
					element = parentNode.skills.splice(index, 1)[0];
					parentNode.skills.splice(newIndex, 0, element);
					changed = [...changed, parentNode];
				} else {
					element = clone.splice(index, 1)[0];
					clone.splice(newIndex, 0, element);
					changed = [...changed, null];
				}
				break;
			case 'a':
				if (!parentNode) {
					return;
				}

				element = parentNode.skills.splice(index, 1)[0];

				if (grandparentNode) {
					element.skill_id = grandparentNode.id;
					grandparentNode.skills = [...grandparentNode.skills, element];
					changed = [...changed, grandparentNode];
				} else {
					element.skill_id = null;
					clone = [...clone, element];
					changed = [...changed, null];
				}

				// skills = clone;

				break;
			case 'd':
				// if (clone[index - 1]) {
				// 	return;
				// }
				if (!parentNode) {
					// console.log(index);
					element = clone.splice(index, 1)[0];
					if (!clone[index - 1]) {
						return;
					}
					element.skill_id = clone[index - 1].id;
					clone[index - 1].skills = [...clone[index - 1].skills, element];
					changed = [...changed, null, clone[index - 1]];
					console.log('movedRight', 'First Nest');
				} else {
					element = parentNode.skills.splice(index, 1)[0];
					if (!parentNode.skills[index - 1]) {
						return;
					}
					element.skill_id = parentNode.skills[index - 1].id;
					parentNode.skills[index - 1].skills = [...parentNode.skills[index - 1].skills, element];
					changed = [...changed, null, parentNode, parentNode.skills[index - 1]];
					console.log('movedRight', 'Go Deeper In');
				}

				break;
			default:
				return;
		}

		order(clone, changed);
	}

	async function remove(skill) {
		if (!$selectedSkill) {
			return;
		}

		await Api.delete(`/skills/${$selectedSkill.id}.json`);
		const clone = [...skills];

		// console.log('skill', $selectedSkill);

		const node = findNode(
			{
				id: -1,
				skills: clone
			},
			$selectedSkill
		);

		const parentNode = findParentNode(
			{
				id: -1,
				skills: clone
			},
			$selectedSkill
		);
		const index = $selectedSkill.position - 1;

		if (parentNode) {
			parentNode.skills.splice(index, 1)[0];
			order(clone, [parentNode]);
		} else {
			clone.splice(index, 1)[0];
			order(clone, null);
		}
	}

	async function order(clone, changed) {
		for (let node of changed) {
			console.log('node', node);
			if (node === null) {
				let i = 0;
				for (let el of clone) {
					el.position = i + 1;
					Api.put(`/skills/${el.id}.json`, {
						position: el.position,
						skill_id: el.skill_id
					});
					i++;
				}
			}
			let i = 0;
			if (!node) {
			} else {
				for (let el of node.skills) {
					el.position = i + 1;
					Api.put(`/skills/${el.id}.json`, {
						position: el.position,
						skill_id: el.skill_id
					});
					i++;
				}
			}
		}

		skills = clone;
	}
</script>

<section>
	<div
		class="sticky"
		class:isStuck
		use:sticky={{ stickToTop: true }}
		on:stuck={handleStuck}
		data-position="top"
	>
		<div class="input-group mb-3">
			<input
				type="text"
				class="form-control"
				placeholder="Add Skill"
				aria-label="Add Skill"
				aria-describedby="basic-addon2"
				bind:value={newSkillTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="input-group-append" on:click={addSkill}>
				{#if $selectedSkill}
					<div class="btn btn-warning">Nest</div>
				{:else}
					<div class="btn btn-info">Add</div>
				{/if}
			</div>
		</div>
	</div>

	{#each skills || [] as skill}
		<ul class="clean-list">
			<Row item={skill} {remove} type="skill" {move} />
		</ul>
	{/each}
</section>

<style>
	.sticky {
		position: sticky;
		padding: 1rem;
		background: #fff;
		transition: all 0.3s;
		z-index: 9999;
	}

	.sticky[data-position='top'] {
		top: 1rem;
	}
</style>
