import { readable, writable } from 'svelte/store';

export const globalViewCategory = writable('Languages');

export const loomifiedView = writable(false);

export const showGuide = writable(true);
export const showGuideButton = writable(false);

export const showMobileMenu = writable(false);

export const currentPage = writable('default');

export const correctSound = writable(0);
export const incorrectSound = writable(0);
export const victorySound = writable(0);
