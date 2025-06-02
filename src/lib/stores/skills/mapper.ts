import { writable } from 'svelte/store';

// export const api = readable('http://localhost:3000');
// export const api = readable('https://www.commandfeel.com');

export interface Skill {
	id: number;
	title: string;
	slug: string;
	skills: Skill[];
	position: number;
	skill_id: number | null;
}

export const selectedSkill = writable<Skill | null>(null);

export const selectSkill = (item: Skill | null) => {
	selectedSkill.set(item);
};
