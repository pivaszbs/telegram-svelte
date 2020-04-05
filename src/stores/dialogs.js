import { writable } from 'svelte/store';

const createDialogs = () => {
	const dialogs = writable([]);
	const set = d => {
		dialogs.set(d.map(dialog => ({ ...dialog, photo: dialog.photo?.src })));
	};
	return {
		...dialogs,
		set,
	};
};
export const dialogs = createDialogs();
export const archives = writable([]);
export const load = writable(false);
