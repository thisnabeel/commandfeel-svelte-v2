import { readable, writable } from 'svelte/store';

// export const api = readable('http://localhost:3000');
// export const api = readable('https://www.commandfeel.com');

export const selectedSkill = writable(null);

export const selectSkill = (item) => {
	selectedSkill.set(item);
};
