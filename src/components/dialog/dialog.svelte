<script>
	import { loadDialog } from './../../services/storeService.js';
	import RightTop from './right-top.svelte';
	import RightBottom from './right-bottom.svelte';
	import Avatar from '../avatar/avatar.svelte';
	import Ripple from '@smui/ripple';
	import './dialog.scss';
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
		scrollTopElement;

	const onClick = () => {
		loadDialog(id);
	};
</script>

<div
	on:click="{onClick}"
	tabindex="0"
	use:Ripple="{{ ripple: true, color: 'secondary' }}"
	class="dialog"
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
