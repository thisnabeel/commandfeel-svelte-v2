import storage from '$lib/stores/storage';
import { writable } from 'svelte/store';

export const user = storage('user', null);
export const credsView = writable(null);
