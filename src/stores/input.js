import { writable, derived } from 'svelte/store';

export const country = writable('');
export const focused = writable('');

export const hideCountryPopup = derived(focused, $focused => $focused !== 'country');

const updatePhone = text => {
    const newText = text.replace(/\D/g, '').slice(0, 15);
    const idx = Math.max(newText.length - 10, 1);
    const code = newText.slice(0, idx);
    const number = newText.slice(idx);
    if (number.length >= 9) {
        return `+${code} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 8)} ${number.slice(8)}`;
    }
    if (number.length >= 7) {
        return `+${code} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    if (number.length >= 5) {
        return `+${code} ${number.slice(0, 3)} ${number.slice(3)}`;
    }
    if (number.length >= 1) {
        return `+${code} ${number.slice(0)}`;
    }
    return `+${code}`;
};

const createPhone = () => {
    const { subscribe, set, update } = writable('');

	return {
		subscribe,
        reset: () => set(''),
        set: (value) => set(updatePhone(value))
	};
}
export const phone = createPhone();
