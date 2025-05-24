<script>
	import { onMount, afterUpdate } from 'svelte';

	import API from '$lib/api/api';
	import ListItem from './ListItem.svelte';
	import debounceSave from '$lib/functions/debounce';

	export let readOnly = false;
	export let language = null;
	export let starters;
	export let progress;
	let algorithms = [];
	let selectedAlgorithm = null;
	let visitingAlgorithm = null;
	let organizedAlgorithms = [];

	let unsaved = false;
	let saving = false;

	onMount(async () => {
		const res = await API.get('/algorithms.json');
		algorithms = res;
		console.log('first algorithm fetch', algorithms);
		organizedAlgorithms = organizeAlgorithms(algorithms);
		console.log('organized algorithms', organizedAlgorithms);
	});

	afterUpdate(() => {
		// Add event listeners for arrow key navigation
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			// Remove event listeners on component destruction
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	afterUpdate(() => {
		// Add event listeners for arrow key navigation
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			// Remove event listeners on component destruction
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function handleKeyDown(event) {
		if (!selectedAlgorithm || !organizedAlgorithms || readOnly) return;

		let index = -1;
		let siblings = findSiblings(organizedAlgorithms, selectedAlgorithm.id);

		if (selectedAlgorithm.algorithm_id) {
			index = siblings.findIndex((algorithm) => algorithm.id === selectedAlgorithm.id);
		} else {
			siblings = organizedAlgorithms;
			index = organizedAlgorithms.findIndex((algorithm) => algorithm.id === selectedAlgorithm.id);
		}

		if (event.key === 's' || event.key === 'w') {
			handleUpDownKey(event, siblings, index);
		} else if (event.key === 'd') {
			handleRightKey(siblings, index);
		} else if (event.key === 'a') {
			handleLeftKey(siblings, index);
		}

		organizedAlgorithms = organizedAlgorithms.map((algorithm) => {
			if (algorithm.id === selectedAlgorithm.id && selectedAlgorithm.algorithm_id) {
				return {
					...algorithm,
					children: [...siblings]
				};
			}
			return algorithm;
		});

		unsaved = true;

		// saveOrder(organizedAlgorithms);
		// saveOrder(updatePositions(organizedAlgorithms));
	}

	async function saveOrder() {
		// console.log({ array });
		saving = true;
		const array = updatePositions(organizedAlgorithms);
		await debounceSave('/algorithms/reorder', {
			list: flattenTree(array).map((g) => {
				return { id: g.id, algorithm_id: g.algorithm_id, position: g.position };
			})
		});
		saving = false;
		unsaved = false;
	}

	function updatePositions(array) {
		// console.log('GOTTEN', array);
		if (!array) return;
		for (let i = 0; i < array.length; i++) {
			array[i].position = i + 1;
			array[i].children = updatePositions(array[i].children);
		}

		return array;
	}

	function handleUpDownKey(event, container, index) {
		if (selectedAlgorithm) {
			if (!container) {
				console.log('no parent');
			} else {
				console.log({ container });
			}

			if (event.key === 's' && index < container.length - 1) {
				// Move the algorithm down
				swapPositions(container, index, index + 1);
			} else if (event.key === 'w' && index > 0) {
				// Move the algorithm up
				swapPositions(container, index, index - 1);
			}
		}
	}

	function handleRightKey(siblings, index) {
		const currentIndex = siblings.indexOf(selectedAlgorithm);
		const futureParentIndex = currentIndex - 1;

		console.log({ futureParentIndex });

		if (futureParentIndex >= 0 && futureParentIndex < siblings.length - 1) {
			// Save the removed element
			const removedElement = siblings.splice(currentIndex, 1)[0];

			selectedAlgorithm.algorithm_id = siblings[futureParentIndex].id;
			if (!siblings[futureParentIndex].children) {
				siblings[futureParentIndex].children = [];
			}
			siblings[futureParentIndex].children = [
				...siblings[futureParentIndex].children,
				removedElement
			];
		}
	}

	function handleLeftKey(siblings, index) {
		if (!selectedAlgorithm || !selectedAlgorithm.algorithm_id) {
			return;
		} else {
			const grandparentId = findGrandparentId(organizedAlgorithms, selectedAlgorithm.algorithm_id);
			let newParent;
			let currentParent;
			let currentParentIndex;
			if (grandparentId !== null) {
				newParent = findAlgorithm(organizedAlgorithms, grandparentId);
				currentParent = findAlgorithm(organizedAlgorithms, selectedAlgorithm.algorithm_id);
				currentParentIndex = newParent.children.findIndex(
					(algorithm) => algorithm.id === currentParent.id
				);

				console.log({ newParent });
				console.log({ currentParent });
				console.log({ currentParentIndex });
			} else {
				newParent = organizedAlgorithms;
				currentParent = findAlgorithm(organizedAlgorithms, selectedAlgorithm.algorithm_id);
				currentParentIndex = newParent.findIndex((algorithm) => algorithm.id === currentParent.id);
			}

			if (currentParentIndex >= 0) {
				// Remove the selected algorithm from its parent
				const removedElement = currentParent.children.splice(index, 1)[0];
				console.log(currentParent.children);
				removedElement.algorithm_id = newParent.id;
				if (Array.isArray(newParent)) {
					newParent.splice(currentParentIndex + 1, 0, removedElement);
				} else {
					newParent.children.splice(currentParentIndex + 1, 0, removedElement);
				}
				return;
			}
			return;
		}
	}

	function swapPositions(array, indexA, indexB) {
		const temp = array[indexA];
		array[indexA] = array[indexB];
		array[indexB] = temp;
	}

	function flattenTree(tree) {
		return tree.reduce((acc, node) => {
			acc.push(node);
			if (node.children) {
				acc.push(...flattenTree(node.children));
			}
			return acc;
		}, []);
	}
	function findGrandparentId(arr, algorithmId) {
		for (let algorithm of arr) {
			if (algorithm.children && algorithm.children.some((child) => child.id === algorithmId)) {
				return algorithm.id;
			}
			if (algorithm.children) {
				const result = findGrandparentId(algorithm.children, algorithmId);
				if (result !== null) {
					return result; // Return if found in children
				}
			}
		}
		return null;
	}

	function findAlgorithm(arr, algorithmId) {
		// console.log({ algorithmId });
		for (let algorithm of arr) {
			if (algorithm.id === algorithmId) {
				return algorithm;
			}
			if (algorithm.children) {
				const result = findAlgorithm(algorithm.children, algorithmId);
				if (result !== null) {
					return result; // Return if found in children
				}
			}
		}
		return null;
	}
	// function findAlgorithmIndex(arr, algorithmId) {
	// 	for (let algorithm of arr) {
	// 		// console.log({ algorithm }, algorithmId);
	// 		if (algorithm.id === algorithmId) {
	// 			return algorithm;
	// 		}
	// 		const result = findParent(algorithm.children || [], algorithmId);
	// 	}
	// 	return algorithm;
	// }

	function findSiblings(arr, algorithmId) {
		for (let algorithm of arr) {
			if (algorithm.children && algorithm.children.some((child) => child.id === algorithmId)) {
				return algorithm.children;
			}
			if (algorithm.children) {
				const result = findSiblings(algorithm.children, algorithmId);
				if (result.length > 0) {
					console.log('FOUND IN CHILDREN');
					return result; // Return if found in children
				}
			}
		}
		return [];
	}

	// $: organizedAlgorithms = organizeAlgorithms(algorithms);
	// $: console.log({ organizedAlgorithms });

	function organizeAlgorithms(algorithms, parentId = null) {
		// Filter algorithms based on the current parent ID
		const filteredAlgorithms = algorithms.filter(
			(algorithm) => algorithm.algorithm_id === parentId
		);

		// Recursively organize children for each filtered algorithm
		const organizedChildren = filteredAlgorithms.map((parentAlgorithm) => {
			const children = organizeAlgorithms(algorithms, parentAlgorithm.id);
			return { ...parentAlgorithm, children };
		});

		return organizedChildren;
	}

	function selectAlgorithm(algorithm) {
		selectedAlgorithm = algorithm;
		console.log({ selectedAlgorithm });
	}

	function visitAlgorithm(algorithm) {
		visitingAlgorithm = algorithm;
		console.log({ visitingAlgorithm });
	}
</script>

<div class="content">
	<div class="wrapper">
		<ul class="clean-list algorithms">
			{#each organizedAlgorithms || [] as algorithm}
				<ListItem
					{starters}
					{language}
					{readOnly}
					{selectedAlgorithm}
					{algorithm}
					{selectAlgorithm}
					{visitAlgorithm}
					{progress}
				/>
			{/each}
		</ul>
	</div>

	<div class="saveProgress">
		{#if unsaved && !saving}
			<div class="btn btn-warning" on:click={saveOrder}>Unsaved Progress</div>
		{:else}
			<div class="btn btn-success"><i class="fa fa-check" /></div>
		{/if}

		{#if saving}
			<div class="btn btn-info">Saving</div>
		{/if}
	</div>
</div>

<style>
	.saveProgress {
		position: fixed;
		bottom: 10px;
		right: 10px;
	}
	/* ... (your existing styles) */
	.selected {
		background-color: #b8eeff !important;
	}

	.wrapper {
		padding: 20px;
	}

	.algorithm {
		padding: 8px;
		font-size: 24px;
		background: rgb(255 248 222);
		margin: 4px;
		border-radius: 8px;
	}
</style>
