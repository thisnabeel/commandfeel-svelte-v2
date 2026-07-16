import { writable, derived, get } from 'svelte/store';
import Api from '$lib/api/api';

/** @type {import('svelte/store').Writable<Record<string, boolean>>} */
export const featureFlags = writable({});

export const featureFlagsLoaded = writable(false);

export function flagEnabled(key) {
	return !!get(featureFlags)[key];
}

export const showGuideFlag = derived(featureFlags, ($flags) => !!$flags.show_guide);

export async function loadFeatureFlags() {
	try {
		const map = await Api.get('/feature_flags');
		featureFlags.set(map && typeof map === 'object' ? map : {});
	} catch {
		featureFlags.set({});
	} finally {
		featureFlagsLoaded.set(true);
	}
}
