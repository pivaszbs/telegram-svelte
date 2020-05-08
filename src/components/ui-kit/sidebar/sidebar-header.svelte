<script>
	import PopupItem from './../../popup-item/popup-item.svelte';
	import Popup from './../../popup/popup.svelte';
	import Logout from 'images/logout.svg';
	import More from 'images/more.svg';
	import Back from 'images/back.svg';
	let headerButton;
	let headerText = 'Settings';
	let more = false;
	let items = [
		{ className: 'settings-log-out', img: Logout, text: 'Log out' },
	];
</script>

<div class="sidebar__header header">
	<div class="header__back icon">
		<img src="{Back}" alt="" />
	</div>
	<div class="header__title">{headerText}</div>
	<div on:click="{() => (more = !more)}" class="header__more icon">
		<img src="{More}" alt="More" />
		{#if more}
			<Popup class="menu-list">
				{#each items as { img, text, className }}
					<PopupItem class="{className}">
						<img slot="img" src="{img}" alt="" />
						<div slot="text" class="menu-list__text">{text}</div>
					</PopupItem>
				{/each}
			</Popup>
		{/if}
	</div>
</div>

<style lang="scss">
	.header {
		grid-column: 1/4;

		display: grid;
		grid-template-columns: 60px auto 60px;

		&__title {
			align-self: center;
			font-size: var(--font-size-large);
			font-weight: 600;
		}

		&__more {
			position: relative;
		}
	}
</style>
