<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import { selectAlgorithm, wondersMap } from '$lib/stores/main';
	import Row from './Row.svelte';
	import { selectedAlgorithm } from '$lib/stores/algorithms/mapper';

	import sticky from '$lib/functions/sticky.js';

	let isStuck = false;
	let writing = false;

	function handleStuck(e) {
		isStuck = e.detail.isStuck;
	}

	let algorithms;
	let newAlgorithmTitle = '';
	let algorithmsmap;

	onMount(() => {
		getAlgorithms();
		// Add event listener for arrow key presses
		window.addEventListener('keydown', move);
	});

	const getAlgorithms = async () => {
		const response = await Api.get('/algorithms.json');
		console.log('response', response);
		let json = response;
		algorithms = json;
		console.log('algorithms set', algorithms);
		let parents = json.filter((obj) => {
			return obj.algorithm_id === null;
		});
		parents.map((algorithm, index) => {
			// Connect each Child to Parent
			connectChildToParent(algorithm);
		});
		function connectChildToParent(algorithm) {
			let children = json.filter((obj) => {
				return obj.algorithm_id === algorithm.id;
			});
			algorithm['algorithms'] = children;
			algorithm['algorithms'].map((algorithm, index) => {
				// Connect each Child to Parent
				connectChildToParent(algorithm);
			});
		}
		console.log('algorithms', parents);
		algorithmsMap = parents;
	};

	const findNode = (root, target) => {
		if (!root) {
			return null;
		}

		if (root.id === target.id) {
			return root;
		}

		for (let algorithm of root.algorithms) {
			const foundAlgorithm = findNode(algorithm, target);
			if (foundAlgorithm) {
				return foundAlgorithm;
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
		if (root.id === target.algorithm_id) {
			return root;
		}

		for (let algorithm of root.algorithms) {
			const foundAlgorithm = findParentNode(algorithm, target);
			if (foundAlgorithm) {
				return foundAlgorithm;
			}
		}

		return null;
	};

	async function addAlgorithm() {
		if (newAlgorithmTitle.length > 0) {
			if ($selectedAlgorithm && $selectedAlgorithm.id) {
				const clone = [...algorithms];

				const node = findNode(
					{
						id: -1,
						algorithms: clone
					},
					$selectedAlgorithm
				);

				const response = await Api.post('/algorithms.json', {
					title: newAlgorithmTitle,
					algorithm_id: $selectedAlgorithm.id,
					position: node.algorithms.length + 1
				});

				node.algorithms = [...node.algorithms, response];

				console.log(clone);
				algorithms = clone;
			} else {
				const response = await Api.post('/algorithms.json', {
					title: newAlgorithmTitle,
					position: algorithms.length + 1
				});
				algorithms = [...algorithms, response];
			}

			newAlgorithmTitle = '';
		}
	}

	async function move(event) {
		if (!$selectedAlgorithm) {
			return;
		}

		if ($selectedAlgorithm && writing) {
			return;
		}
		let clone = [...algorithms];

		// console.log('algorithm', $selectedAlgorithm);

		const node = findNode(
			{
				id: -1,
				algorithms: clone
			},
			$selectedAlgorithm
		);

		const parentNode = findParentNode(
			{
				id: -1,
				algorithms: clone
			},
			$selectedAlgorithm
		);

		const grandparentNode = findParentNode(
			{
				id: -1,
				algorithms: clone
			},
			parentNode
		);
		const index = $selectedAlgorithm.position - 1;
		let newIndex = null;
		let element = null;

		let changed = [];

		switch (event.key) {
			case 'w':
				console.log('up');

				newIndex = index - 1;

				if (parentNode) {
					if (!parentNode.algorithms[newIndex]) {
						return;
					}

					element = parentNode.algorithms.splice(index, 1)[0];
					parentNode.algorithms.splice(newIndex, 0, element);
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
					if (!parentNode.algorithms[newIndex]) {
						return;
					}
					// console.log(index, parentNode.algorithms[index]);
					element = parentNode.algorithms.splice(index, 1)[0];
					parentNode.algorithms.splice(newIndex, 0, element);
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

				element = parentNode.algorithms.splice(index, 1)[0];

				if (grandparentNode) {
					element.algorithm_id = grandparentNode.id;
					grandparentNode.algorithms = [...grandparentNode.algorithms, element];
					changed = [...changed, grandparentNode];
				} else {
					element.algorithm_id = null;
					clone = [...clone, element];
					changed = [...changed, null];
				}

				// algorithms = clone;

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
					element.algorithm_id = clone[index - 1].id;
					clone[index - 1].algorithms = [...clone[index - 1].algorithms, element];
					changed = [...changed, null, clone[index - 1]];
					console.log('movedRight', 'First Nest');
				} else {
					element = parentNode.algorithms.splice(index, 1)[0];
					if (!parentNode.algorithms[index - 1]) {
						return;
					}
					element.algorithm_id = parentNode.algorithms[index - 1].id;
					parentNode.algorithms[index - 1].algorithms = [
						...parentNode.algorithms[index - 1].algorithms,
						element
					];
					changed = [...changed, null, parentNode, parentNode.algorithms[index - 1]];
					console.log('movedRight', 'Go Deeper In');
				}

				break;
			default:
				return;
		}

		order(clone, changed);
	}

	async function remove(algorithm) {
		if (!$selectedAlgorithm) {
			return;
		}

		await Api.delete(`/algorithms/${$selectedAlgorithm.id}.json`);
		const clone = [...algorithms];

		// console.log('algorithm', $selectedAlgorithm);

		const node = findNode(
			{
				id: -1,
				algorithms: clone
			},
			$selectedAlgorithm
		);

		const parentNode = findParentNode(
			{
				id: -1,
				algorithms: clone
			},
			$selectedAlgorithm
		);
		const index = $selectedAlgorithm.position - 1;

		if (parentNode) {
			parentNode.algorithms.splice(index, 1)[0];
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
					Api.put(`/algorithms/${el.id}.json`, {
						position: el.position,
						algorithm_id: el.algorithm_id
					});
					i++;
				}
			}
			let i = 0;
			if (!node) {
			} else {
				for (let el of node.algorithms) {
					el.position = i + 1;
					Api.put(`/algorithms/${el.id}.json`, {
						position: el.position,
						algorithm_id: el.algorithm_id
					});
					i++;
				}
			}
		}

		algorithms = clone;
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
				placeholder="Add Algorithm"
				aria-label="Add Algorithm"
				aria-describedby="basic-addon2"
				bind:value={newAlgorithmTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="input-group-append" on:click={addAlgorithm}>
				{#if $selectedAlgorithm}
					<div class="btn btn-warning">Nest</div>
				{:else}
					<div class="btn btn-info">Add</div>
				{/if}
			</div>
		</div>
	</div>

	{#each algorithms || [] as algorithm}
		<ul class="clean-list">
			<Row item={algorithm} {remove} type="algorithm" {move} />
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
