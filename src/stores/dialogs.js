import { writable } from 'svelte/store';

export const dialogs = writable([]);
export const archives = writable([]);
export const load = writable(false);
