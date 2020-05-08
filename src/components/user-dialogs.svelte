<script>
	import { loadBotom, loadTop } from './../services/storeService.js';
	import { onMount } from 'svelte';
	import { loadFirstDialogs } from '../services/storeService';
	import { dialogs, load, topDialog } from '../stores/dialogs';
	import Dialog from './dialog/dialog.svelte';
	let userDialogs;
	let lastScroll = 0;
	let update = false;
	const updateTimeout = () =>
		setTimeout(() => {
			update = false;
		}, 100);

	const scrollBottom = () => {
		update = true;
		loadBotom();
		updateTimeout();
	};

	const scrollTop = () => {
		update = true;
		loadTop();
		updateTimeout();
	};

	onMount(async () => {
		await loadFirstDialogs();
		// const interval = setInterval(() => {
		// 	if (userDialogs.scrollTop > userDialogs.offsetHeight - 200 && !$load && !update) {
		// 		scrollBottom();
		// 		return;
		// 	}
		// 	if (userDialogs.scrollTop < 200 && !$load && scrollCount > 0 && !update) {
		// 		scrollTop();
		// 		return;
		// 	}
		// 	update = false;
		// }, 500);
		// return interval;
	});

	const scrollY = e => {
		const isBottomScroll = lastScroll < userDialogs.scrollTop;
		const isTopScroll = !isBottomScroll;
		if (isBottomScroll && !update) {
			if (
				userDialogs.scrollTop >= userDialogs.offsetHeight * 1.5 &&
				!$load
			) {
				scrollBottom();
				return;
			}
		} else if (
			isTopScroll &&
			!update &&
			userDialogs.scrollTop <= userDialogs.offsetHeight / 2 &&
			!$load
		) {
			scrollTop();
			return;
		}
		lastScroll = userDialogs.scrollTop;
	};
</script>

<div bind:this="{userDialogs}" on:scroll="{scrollY}" class="user-dialogs">
	{#each $dialogs as dialog, i (dialog.id)}
		<Dialog {...dialog} />
	{/each}
</div>

<style>
	.user-dialogs {
		overflow-y: auto;
	}
</style>
