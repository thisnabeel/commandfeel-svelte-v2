import { readable, writable } from 'svelte/store';

export const selectedAlgorithm = writable(null);

export const selectAlgorithm = (item) => {
	selectedAlgorithm.set(item);
};

export const algorithmStore = writable([]);
