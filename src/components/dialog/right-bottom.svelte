<script>
	import Pinned from 'inline/pinned.svg';

	export let unreadCount;
	export let pinned;
	export let muted;
</script>

<div
	class="right-bottom"
	class:unread="{unreadCount > 0}"
	class:muted
	class:pinned="{unreadCount === 0 && pinned}"
>
	{#if unreadCount > 0}
		<div class="count">{unreadCount}</div>
	{:else if pinned}
		{@html Pinned}
	{/if}
</div>
