import { writable } from 'svelte/store';

const createRouter = () => {
	const { subscribe, set } = writable({ route: '', props: {} });

	return {
		subscribe,
		setRoute: route => set({ route }),
		setRouteAndProps: (route, props) => set({ route, props }),
	};
};

export const router = createRouter();
