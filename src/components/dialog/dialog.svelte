<script>
	import { loadDialog } from './../../services/storeService.js';
	import AppMessagesManager from '../../services/TelegramApi/js/App/AppMessagesManager';
	import RightTop from './right-top.svelte';
	import RightBottom from './right-bottom.svelte';
	import Avatar from '../avatar/avatar.svelte';
	import Ripple from '@smui/ripple';
	import './dialog.scss';
	import { afterUpdate, onMount } from 'svelte';
	import { dialogs } from '../../stores/dialogs';
	export let photo;
	export let unreadCount,
		title,
		text,
		time,
		pinned,
		fromName,
		out,
		id,
		read, //needed from new API
		saved, //needed from store/API
		online,
		active,
		muted,
		last,
		top,
		bottom,
		observer,
		middle;

	$: {
		if ((top || bottom) && dialog) {
			observer.observe(dialog);
		}
	}

	let dialog;

	const onClick = () => {
		loadDialog(id);
	};
</script>

<div
	bind:this="{dialog}"
	on:click="{onClick}"
	tabindex="0"
	use:Ripple="{{ ripple: true, color: 'secondary' }}"
	class="dialog"
	{top}
	{bottom}
>
	<div class:online class="avatar-wrapper">
		<Avatar medium {photo} {title} />
	</div>
	<div class="name">{title}</div>
	<div class="short">
		{#if fromName}
			<span class="short_from">{fromName}</span>
			:
		{/if}
		{text}
	</div>
	<RightTop {out} {time} {read} />
	<RightBottom {unreadCount} {pinned} {muted} />
</div>

<style lang="scss">
	.online {
		position: relative;
		&::before {
			position: absolute;
			content: '';
			height: 10px;
			width: 10px;
			border-radius: 50%;
			background: var(--green);
			border: 2px solid var(--white);
			right: 0;
			bottom: 2px;
		}
	}

	.dialog {
		padding: var(--indent-small) var(--indent-medium);
		max-height: 10vh;
		min-height: 60px;
		display: grid;
		grid-template-columns: 60px 1fr 60px;
		column-gap: var(--indent-medium);
		grid-template-rows: 1fr 1fr;
		align-items: center;
		margin: var(--indent-small) var(--indent-medium);
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
			font-size: var(--font-size-medium);
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
			font-size: var(--font-size-medium);
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;

			&_from {
				color: var(--black);
			}
		}
	}
</style>
