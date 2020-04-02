<script>
	import { onMount } from 'svelte';
	import { loadFirstDialogs } from '../services/storeService';
	import { dialogs } from '../stores/dialogs';
	import Dialog from './dialog/dialog.svelte';
	onMount(() => {
		loadFirstDialogs();
	});
</script>

<div class="user-dialogs">
	{#each $dialogs as dialog, i (dialog.id)}
		<Dialog {...dialog} />
	{/each}
</div>
