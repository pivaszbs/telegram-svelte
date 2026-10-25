import { mount } from 'svelte';
import App from './App.svelte';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import 'Source/assets/global.css';
import 'Source/assets/global.scss';

const app = mount(App, {
	target: document.body,
});

export default app;
