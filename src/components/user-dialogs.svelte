<script>
	import {
		loadBottomDialogs,
		loadTopDialogs,
	} from './../services/storeService.js';
	import { onMount } from 'svelte';
	import { loadFirstDialogs } from '../services/storeService';
	import { dialogs, load } from '../stores/dialogs';
	import Dialog from './dialog/dialog.svelte';

	let firstLoad = true;

	const observer = new IntersectionObserver((entries, observer) => {
		if (firstLoad) {
			firstLoad = false;
			return;
		}
		entries.forEach(entry => {
			const { target } = entry;
			const top = JSON.parse(target.getAttribute('top'));
			const bottom = JSON.parse(target.getAttribute('bottom'));
			if (entry.isIntersecting) {
				if (top) {
					loadTopDialogs();
					observer.unobserve(target);
				}
				if (bottom) {
					loadBottomDialogs();
					observer.unobserve(target);
				}
			}
		});
	});

	onMount(async () => {
		await loadFirstDialogs();
	});
</script>

<div class="user-dialogs">
	{#each $dialogs as dialog, i (dialog.id)}
		<Dialog {observer} top="{i === 10}" bottom="{i === 70}" {...dialog} />
	{/each}
</div>

<style>
	.user-dialogs {
		overflow-y: auto;
	}
</style>
