<script>
	import { loadBotom, loadTop } from './../services/storeService.js';
	import { onMount } from 'svelte';
	import { loadFirstDialogs } from '../services/storeService';
	import { dialogs, load, topDialog } from '../stores/dialogs';
	import Dialog from './dialog/dialog.svelte';
	onMount(() => {
		loadFirstDialogs();
	});
	let userDialogs;
	let lastScroll = 0;
	let globalScroll = 0;
	let update = false;

	const scrollY = e => {
		const isBottomScroll = lastScroll < userDialogs.scrollTop;
		const isTopScroll = !isBottomScroll; 
		if (isBottomScroll && !update) {
			if (userDialogs.scrollTop >= userDialogs.offsetHeight && !$load) {
				loadBotom();
				globalScroll+=userDialogs.offsetHeight
				update = true;
				return;
			}
		} else if (isTopScroll && !update && userDialogs.scrollTop <= userDialogs.offsetHeight / 2 && !$load) {
			if ($topDialog.id !== $dialogs[3].id) {
				loadTop(globalScroll === userDialogs.offsetHeight);
				globalScroll-=userDialogs.offsetHeight;
				update = true;
				return;
			}
		}
		lastScroll = userDialogs.scrollTop;
		update = false;
	}

</script>

<div bind:this={userDialogs} on:scroll="{scrollY}" class="user-dialogs">
	{#each $dialogs as dialog, i (dialog.id)}
		<Dialog last="{i === $dialogs.length - 1}" {...dialog} />
	{/each}
</div>

<style>
	.user-dialogs {
		overflow-y: auto;
	}
</style>
