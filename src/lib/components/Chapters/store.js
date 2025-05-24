import { readable, writable } from 'svelte/store';

export const chapters = writable([]);
export const chaptersMap = writable([]);

export const wonders = writable([]);
export const wondersMap = writable([]);
export const popularWonders = writable([]);

export const mapShown = writable(false);

export const selectedChapter = writable(null);
export const selectedWonder = writable(null);

export const selectedFeel = writable(null);

export const selectChapter = (item) => {
	selectedChapter.set(item);
	selectedFeel.set(item.feel);
	selectedWonder.set(null);
};
