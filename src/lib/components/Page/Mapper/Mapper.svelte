<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { selectElement, elementsMap, wondersMap } from '$lib/stores/main';
	import Row from './Row.svelte';
	import { selectedElement } from '$lib/stores/elements/mapper';
	import sticky from '$lib/functions/sticky.js';

	let isStuck = false;
	let writing = false;

	function handleStuck(e) {
		isStuck = e.detail.isStuck;
	}

	let elements;
	let newElementTitle = '';
	elementsMap.subscribe((value) => {
		console.log('elementsMap', value);
		elements = value;
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

		for (let element of root.elements) {
			const foundElement = findNode(element, target);
			if (foundElement) {
				return foundElement;
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
		if (root.id === target.element_id) {
			return root;
		}

		for (let element of root.elements) {
			const foundElement = findParentNode(element, target);
			if (foundElement) {
				return foundElement;
			}
		}

		return null;
	};

	async function addElement() {
		if (newElementTitle.length > 0) {
			if ($selectedElement && $selectedElement.id) {
				const clone = [...elements];

				const node = findNode(
					{
						id: -1,
						elements: clone
					},
					$selectedElement
				);

				const response = await Api.post('/elements.json', {
					title: newElementTitle,
					element_id: $selectedElement.id,
					position: node.elements.length + 1
				});

				node.elements = [...node.elements, response];

				console.log(clone);
				elements = clone;
			} else {
				const response = await Api.post('/elements.json', {
					title: newElementTitle,
					position: elements.length + 1
				});
				elements = [...elements, response];
			}

			newElementTitle = '';
		}
	}

	async function move(event) {
		if (!$selectedElement) {
			return;
		}

		if ($selectedElement && writing) {
			return;
		}
		let clone = [...elements];

		// console.log('element', $selectedElement);

		const node = findNode(
			{
				id: -1,
				elements: clone
			},
			$selectedElement
		);

		const parentNode = findParentNode(
			{
				id: -1,
				elements: clone
			},
			$selectedElement
		);

		const grandparentNode = findParentNode(
			{
				id: -1,
				elements: clone
			},
			parentNode
		);
		const index = $selectedElement.position - 1;
		let newIndex = null;
		let element = null;

		let changed = [];

		switch (event.key) {
			case 'w':
				console.log('up');

				newIndex = index - 1;

				if (parentNode) {
					if (!parentNode.elements[newIndex]) {
						return;
					}

					element = parentNode.elements.splice(index, 1)[0];
					parentNode.elements.splice(newIndex, 0, element);
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
					if (!parentNode.elements[newIndex]) {
						return;
					}
					// console.log(index, parentNode.elements[index]);
					element = parentNode.elements.splice(index, 1)[0];
					parentNode.elements.splice(newIndex, 0, element);
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

				element = parentNode.elements.splice(index, 1)[0];

				if (grandparentNode) {
					element.element_id = grandparentNode.id;
					grandparentNode.elements = [...grandparentNode.elements, element];
					changed = [...changed, grandparentNode];
				} else {
					element.element_id = null;
					clone = [...clone, element];
					changed = [...changed, null];
				}

				// elements = clone;

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
					element.element_id = clone[index - 1].id;
					clone[index - 1].elements = [...clone[index - 1].elements, element];
					changed = [...changed, null, clone[index - 1]];
					console.log('movedRight', 'First Nest');
				} else {
					element = parentNode.elements.splice(index, 1)[0];
					if (!parentNode.elements[index - 1]) {
						return;
					}
					element.element_id = parentNode.elements[index - 1].id;
					parentNode.elements[index - 1].elements = [
						...parentNode.elements[index - 1].elements,
						element
					];
					changed = [...changed, null, parentNode, parentNode.elements[index - 1]];
					console.log('movedRight', 'Go Deeper In');
				}

				break;
			default:
				return;
		}

		order(clone, changed);
	}

	async function remove(element) {
		if (!$selectedElement) {
			return;
		}

		await Api.delete(`/elements/${$selectedElement.id}.json`);
		const clone = [...elements];

		// console.log('element', $selectedElement);

		const node = findNode(
			{
				id: -1,
				elements: clone
			},
			$selectedElement
		);

		const parentNode = findParentNode(
			{
				id: -1,
				elements: clone
			},
			$selectedElement
		);
		const index = $selectedElement.position - 1;

		if (parentNode) {
			parentNode.elements.splice(index, 1)[0];
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
					Api.put(`/elements/${el.id}.json`, {
						position: el.position,
						element_id: el.element_id
					});
					i++;
				}
			}
			let i = 0;
			if (!node) {
			} else {
				for (let el of node.elements) {
					el.position = i + 1;
					Api.put(`/elements/${el.id}.json`, {
						position: el.position,
						element_id: el.element_id
					});
					i++;
				}
			}
		}

		elements = clone;
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
				placeholder="Add Element"
				aria-label="Add Element"
				aria-describedby="basic-addon2"
				bind:value={newElementTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="input-group-append" on:click={addElement}>
				{#if $selectedElement}
					<div class="btn btn-warning">Nest</div>
				{:else}
					<div class="btn btn-info">Add</div>
				{/if}
			</div>
		</div>
	</div>

	{#each elements || [] as element}
		<ul class="clean-list">
			<Row item={element} {remove} type="element" {move} />
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
