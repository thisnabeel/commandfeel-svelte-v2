import { writable } from 'svelte/store';
import type { InfrastructurePattern } from '$lib/types/infrastructure_patterns';

export const selectedInfrastructurePattern = writable<InfrastructurePattern | null>(null);
