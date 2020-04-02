<script>
	import RightTop from './right-top.svelte';
	import RightBottom from './right-bottom.svelte';
	import Avatar from '../avatar/avatar.svelte';
	import Ripple from '@smui/ripple';
	import { loadPeerDialog } from '../../services/storeService';
	export let photo,
		unreadCount,
		title,
		text,
		time,
		pinned,
		from_name,
		message_info,
		peer;
	const { out } = message_info; //needed from new API
	export let read; //needed from new API
	export let saved; //needed from store/API
	export let online, active;
	const onClick = () => {
		if (active) {
			return;
		}

		loadPeerDialog(peer);
	};
</script>

<div
	on:click="{onClick}"
	tabindex="0"
	use:Ripple="{{ ripple: true, color: 'secondary' }}"
	class="dialog"
>
	<div class="avatar-wrapper">
		<Avatar medium {photo} {online} {title} />
	</div>
	<div class="name">{title}</div>
	<div class="short">
		{#if from_name}
			<span class="short_from">{from_name}</span>
			:
		{/if}
		{text}
	</div>
	<RightTop {out} {time} {read} />
	<RightBottom {unreadCount} {pinned} />
</div>

<style lang="scss">
	.dialog {
		padding: 4px 8px;
		max-height: 10vh;
		min-height: 60px;
		display: grid;
		grid-template-columns: 60px 1fr 60px;
		column-gap: 8px;
		grid-template-rows: 1fr 1fr;
		align-items: center;
		margin: 4px 8px;
		border-radius: 8px;
		user-select: none;

		&:hover {
			background-color: var(--light-gray);
			cursor: pointer;
		}

		&_active {
			background-color: var(--light-gray);
		}

		.avatar-wrapper {
			justify-self: center;
			grid-column: 1;
			grid-row: span 2;
		}

		.name {
			grid-column: 2;
			grid-row: 1;
			font-weight: 600;
			font-size: 16px;
			align-self: flex-end;
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
		}

		.short {
			grid-column: 2/3;
			grid-row: 2;
			align-self: flex-start;
			color: var(--secondary);
			font-size: 16px;
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;

			&_from {
				color: var(--black);
			}
		}
	}
</style>
