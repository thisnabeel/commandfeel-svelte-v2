<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api.js';
	import {
		selectChapter,
		chaptersMap,
		wondersMap,
		selectedChapter
	} from '$lib/components/Chapters/store.js';
	import Row from './Row.svelte';

	import sticky from '$lib/functions/sticky.js';

	let isStuck = false;
	let writing = false;

	function handleStuck(e) {
		isStuck = e.detail.isStuck;
	}

	let chapters;
	let newChapterTitle = '';
	chaptersMap.subscribe((value) => {
		console.log('chaptersMap', value);
		chapters = value;
	});

	onMount(() => {
		// Add event listener for arrow key presses
		getChapters();
		window.addEventListener('keydown', move);
	});

	const getChapters = async () => {
		const response = await Api.get('/chapters.json');
		console.log('response', response);
		let json = response;
		chapters = json;
		console.log('chapters set', chapters);
		let parents = json.filter((obj) => {
			return obj.chapter_id === null;
		});
		parents.map((chapter, index) => {
			// Connect each Child to Parent
			connectChildToParent(chapter);
		});
		function connectChildToParent(chapter) {
			let children = json.filter((obj) => {
				return obj.chapter_id === chapter.id;
			});
			chapter['chapters'] = children;
			chapter['chapters'].map((chapter, index) => {
				// Connect each Child to Parent
				connectChildToParent(chapter);
			});
		}
		console.log('chapters', parents);
		chaptersMap.set(parents);
	};
	const findNode = (root, target) => {
		if (!root) {
			return null;
		}

		if (root.id === target.id) {
			return root;
		}

		for (let chapter of root.chapters) {
			const foundChapter = findNode(chapter, target);
			if (foundChapter) {
				return foundChapter;
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
		if (root.id === target.chapter_id) {
			return root;
		}

		for (let chapter of root.chapters) {
			const foundChapter = findParentNode(chapter, target);
			if (foundChapter) {
				return foundChapter;
			}
		}

		return null;
	};

	async function addChapter() {
		if (newChapterTitle.length > 0) {
			if ($selectedChapter && $selectedChapter.id) {
				const clone = [...chapters];

				const node = findNode(
					{
						id: -1,
						chapters: clone
					},
					$selectedChapter
				);

				const response = await Api.post('/chapters.json', {
					title: newChapterTitle,
					chapter_id: $selectedChapter.id,
					position: node.chapters.length + 1
				});

				node.chapters = [...node.chapters, response];

				console.log(clone);
				chapters = clone;
			} else {
				const response = await Api.post('/chapters.json', {
					title: newChapterTitle,
					position: chapters.length + 1
				});
				chapters = [...chapters, response];
			}

			newChapterTitle = '';
		}
	}

	async function move(event) {
		// console.log(event);
		if (!$selectedChapter) {
			return;
		}

		console.log({ event });

		// console.log({ event });
		if ($selectedChapter && writing) {
			return;
		}

		// console.log({ event });
		let clone = [...chapters];

		// console.log('chapter', $selectedChapter);
		// console.log({ event });

		const node = findNode(
			{
				id: -1,
				chapters: clone
			},
			$selectedChapter
		);

		// console.log({ event });
		const parentNode = findParentNode(
			{
				id: -1,
				chapters: clone
			},
			$selectedChapter
		);

		const grandparentNode = findParentNode(
			{
				id: -1,
				chapters: clone
			},
			parentNode
		);

		const index = $selectedChapter.position - 1;
		let newIndex = null;
		let element = null;

		let changed = [];

		switch (event.key) {
			case 'w':
				console.log('up');

				newIndex = index - 1;

				if (parentNode) {
					if (!parentNode.chapters[newIndex]) {
						return;
					}

					element = parentNode.chapters.splice(index, 1)[0];
					parentNode.chapters.splice(newIndex, 0, element);
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
					if (!parentNode.chapters[newIndex]) {
						return;
					}
					// console.log(index, parentNode.chapters[index]);
					element = parentNode.chapters.splice(index, 1)[0];
					parentNode.chapters.splice(newIndex, 0, element);
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

				element = parentNode.chapters.splice(index, 1)[0];

				if (grandparentNode) {
					element.chapter_id = grandparentNode.id;
					grandparentNode.chapters = [...grandparentNode.chapters, element];
					changed = [...changed, grandparentNode];
				} else {
					element.chapter_id = null;
					clone = [...clone, element];
					changed = [...changed, null];
				}

				// chapters = clone;

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
					element.chapter_id = clone[index - 1].id;
					clone[index - 1].chapters = [...clone[index - 1].chapters, element];
					changed = [...changed, null, clone[index - 1]];
					console.log('movedRight', 'First Nest');
				} else {
					element = parentNode.chapters.splice(index, 1)[0];
					if (!parentNode.chapters[index - 1]) {
						return;
					}
					element.chapter_id = parentNode.chapters[index - 1].id;
					parentNode.chapters[index - 1].chapters = [
						...parentNode.chapters[index - 1].chapters,
						element
					];
					changed = [...changed, null, parentNode, parentNode.chapters[index - 1]];
					console.log('movedRight', 'Go Deeper In');
				}

				break;
			default:
				return;
		}

		order(clone, changed);
	}

	async function remove(chapter) {
		if (!$selectedChapter) {
			return;
		}

		await Api.delete(`/chapters/${$selectedChapter.id}.json`);
		const clone = [...chapters];

		// console.log('chapter', $selectedChapter);

		const node = findNode(
			{
				id: -1,
				chapters: clone
			},
			$selectedChapter
		);

		const parentNode = findParentNode(
			{
				id: -1,
				chapters: clone
			},
			$selectedChapter
		);
		const index = $selectedChapter.position - 1;

		if (parentNode) {
			parentNode.chapters.splice(index, 1)[0];
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
					Api.put(`/chapters/${el.id}.json`, {
						position: el.position,
						chapter_id: el.chapter_id
					});
					i++;
				}
			}
			let i = 0;
			if (!node) {
			} else {
				for (let el of node.chapters) {
					el.position = i + 1;
					Api.put(`/chapters/${el.id}.json`, {
						position: el.position,
						chapter_id: el.chapter_id
					});
					i++;
				}
			}
		}

		chapters = clone;
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
				placeholder="Add Chapter"
				aria-label="Add Chapter"
				aria-describedby="basic-addon2"
				bind:value={newChapterTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="input-group-append" on:click={addChapter}>
				{#if $selectedChapter}
					<div class="btn btn-warning">Nest</div>
				{:else}
					<div class="btn btn-info">Add</div>
				{/if}
			</div>
		</div>
	</div>

	{#each chapters || [] as chapter}
		<ul class="clean-list">
			<Row item={chapter} {remove} type="chapter" {move} />
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
