import { readable, writable } from 'svelte/store';

// export const api = readable('http://localhost:3000');
// export const api = readable('https://www.commandfeel.com');

export const skills = writable([]);
export const skillsMap = writable([]);

export const wonders = writable([]);
export const wondersMap = writable([]);
export const popularWonders = writable([]);

export const mapShown = writable(false);

export const selectedSkill = writable(null);
export const selectedWonder = writable(null);

export const selectedFeel = writable(null);

export const selectSkill = (item) => {
	selectedSkill.set(item);
	selectedFeel.set(item.feel);
	selectedWonder.set(null);
};

export const selectWonder = (item) => {
	selectedWonder.set(item);
	selectedSkill.set(null);
};

export const selectAlgorithm = (item) => {
	selectedAlgorithm.set(item);
	selectedTrait.set(null);
};

export const selectTrait = (item) => {
	selectedTrait.set(item);
	selectedAlgorithm.set(null);
};

export const goHome = () => {
	selectedWonder.set(null);
	selectedSkill.set(null);
};

export const signIn = () => {
	selectedWonder.set(null);
	selectedSkill.set(null);
};
