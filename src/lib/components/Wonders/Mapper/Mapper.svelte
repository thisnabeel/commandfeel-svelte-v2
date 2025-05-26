<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { selectWonder, wondersMap } from '$lib/stores/main';
	import Row from './Row.svelte';
	import { selectedWonder } from '$lib/stores/wonders/mapper';
	import sticky from '$lib/functions/sticky.js';
	import Fa from 'svelte-fa';
	import { faBolt } from '@fortawesome/free-solid-svg-icons';

	let isStuck = false;
	let writing = false;

	function handleStuck(e) {
		isStuck = e.detail.isStuck;
	}

	let wonders;
	let newWonderTitle = '';
	wondersMap.subscribe((value) => {
		console.log('wondersMap', value);
		wonders = value;
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

		for (let wonder of root.wonders) {
			const foundWonder = findNode(wonder, target);
			if (foundWonder) {
				return foundWonder;
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
		if (root.id === target.wonder_id) {
			return root;
		}

		for (let wonder of root.wonders) {
			const foundWonder = findParentNode(wonder, target);
			if (foundWonder) {
				return foundWonder;
			}
		}

		return null;
	};

	async function addWonder() {
		if (newWonderTitle.length > 0) {
			if ($selectedWonder && $selectedWonder.id) {
				const clone = [...wonders];

				const node = findNode(
					{
						id: -1,
						wonders: clone
					},
					$selectedWonder
				);

				const response = await Api.post('/wonders.json', {
					title: newWonderTitle,
					wonder_id: $selectedWonder.id,
					position: node.wonders.length + 1
				});

				node.wonders = [...node.wonders, response];

				console.log(clone);
				wonders = clone;
			} else {
				const response = await Api.post('/wonders.json', {
					title: newWonderTitle,
					position: wonders.length + 1
				});
				wonders = [...wonders, response];
			}

			newWonderTitle = '';
		}
	}

	async function move(event) {
		if (!$selectedWonder) {
			return;
		}

		if ($selectedWonder && writing) {
			return;
		}
		let clone = [...wonders];

		// console.log('wonder', $selectedWonder);

		const node = findNode(
			{
				id: -1,
				wonders: clone
			},
			$selectedWonder
		);

		const parentNode = findParentNode(
			{
				id: -1,
				wonders: clone
			},
			$selectedWonder
		);

		const grandparentNode = findParentNode(
			{
				id: -1,
				wonders: clone
			},
			parentNode
		);
		const index = $selectedWonder.position - 1;
		let newIndex = null;
		let element = null;

		let changed = [];

		switch (event.key) {
			case 'w':
				console.log('up');

				newIndex = index - 1;

				if (parentNode) {
					if (!parentNode.wonders[newIndex]) {
						return;
					}

					element = parentNode.wonders.splice(index, 1)[0];
					parentNode.wonders.splice(newIndex, 0, element);
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
					if (!parentNode.wonders[newIndex]) {
						return;
					}
					// console.log(index, parentNode.wonders[index]);
					element = parentNode.wonders.splice(index, 1)[0];
					parentNode.wonders.splice(newIndex, 0, element);
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

				element = parentNode.wonders.splice(index, 1)[0];

				if (grandparentNode) {
					element.wonder_id = grandparentNode.id;
					grandparentNode.wonders = [...grandparentNode.wonders, element];
					changed = [...changed, grandparentNode];
				} else {
					element.wonder_id = null;
					clone = [...clone, element];
					changed = [...changed, null];
				}

				// wonders = clone;

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
					element.wonder_id = clone[index - 1].id;
					clone[index - 1].wonders = [...clone[index - 1].wonders, element];
					changed = [...changed, null, clone[index - 1]];
					console.log('movedRight', 'First Nest');
				} else {
					element = parentNode.wonders.splice(index, 1)[0];
					if (!parentNode.wonders[index - 1]) {
						return;
					}
					element.wonder_id = parentNode.wonders[index - 1].id;
					parentNode.wonders[index - 1].wonders = [
						...parentNode.wonders[index - 1].wonders,
						element
					];
					changed = [...changed, null, parentNode, parentNode.wonders[index - 1]];
					console.log('movedRight', 'Go Deeper In');
				}

				break;
			default:
				return;
		}

		order(clone, changed);
	}

	async function remove(wonder) {
		if (!$selectedWonder) {
			return;
		}

		await Api.delete(`/wonders/${$selectedWonder.id}.json`);
		const clone = [...wonders];

		// console.log('wonder', $selectedWonder);

		const node = findNode(
			{
				id: -1,
				wonders: clone
			},
			$selectedWonder
		);

		const parentNode = findParentNode(
			{
				id: -1,
				wonders: clone
			},
			$selectedWonder
		);
		const index = $selectedWonder.position - 1;

		if (parentNode) {
			parentNode.wonders.splice(index, 1)[0];
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
					Api.put(`/wonders/${el.id}.json`, {
						position: el.position,
						wonder_id: el.wonder_id
					});
					i++;
				}
			}
			let i = 0;
			if (!node) {
			} else {
				for (let el of node.wonders) {
					el.position = i + 1;
					Api.put(`/wonders/${el.id}.json`, {
						position: el.position,
						wonder_id: el.wonder_id
					});
					i++;
				}
			}
		}

		wonders = clone;
	}

	async function generateArcade() {
		try {
			const response = await Api.post('/wonders/generate_arcade.json');
			wonders = [...wonders, response];
		} catch (error) {
			console.error('Failed to generate arcade:', error);
		}
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
				placeholder="Add Wonder"
				aria-label="Add Wonder"
				aria-describedby="basic-addon2"
				bind:value={newWonderTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
			/>
			<div class="input-group-append">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="btn-group">
					<div class="btn" on:click={addWonder}>
						{#if $selectedWonder}
							<div class="btn btn-warning">Nest</div>
						{:else}
							<div class="btn btn-info">Add</div>
						{/if}
					</div>
					<div class="btn btn-primary" on:click={generateArcade}>
						<Fa icon={faBolt} />
					</div>
				</div>
			</div>
		</div>
	</div>

	{#each wonders || [] as wonder}
		<ul class="clean-list">
			<Row item={wonder} {remove} type="wonder" {move} />
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

	.btn-group {
		display: flex;
	}

	.btn-primary {
		background-color: #416fff;
		color: white;
		border: 1px solid #3257d3;
	}

	.btn-primary:hover {
		background-color: #3257d3;
	}
</style>
