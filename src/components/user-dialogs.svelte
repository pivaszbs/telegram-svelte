<script>
	import { loadBotom } from './../services/storeService.js';
	import { onMount } from 'svelte';
	import { loadFirstDialogs } from '../services/storeService';
	import { dialogs, load } from '../stores/dialogs';
	import Dialog from './dialog/dialog.svelte';
	onMount(() => {
		loadFirstDialogs();
	});
	let userDialogs;
	const scrollY = e => {
		if (userDialogs.scrollTop >= userDialogs.offsetHeight && !$load) {
			loadBotom();
		}
	}
	$: console.log($dialogs)
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
