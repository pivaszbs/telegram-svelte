<script>
	import PopupItem from './../popup-item/popup-item.svelte';
	import Popup from './../popup/popup.svelte';
	import Help from 'images/help.svg';
	import Settings from 'images/settings.svg';
	import Savedmessages from 'images/savedmessages.svg';
	import Archive from 'images/archive.svg';
	import User from 'images/user.svg';
	import Group from 'images/group.svg';
	import Search from 'inline/search.svg';

	let overlay = true;
	let menuIcon = 'burger';

	import './menu.scss';
	const focusHandler = () => {
		overlay = false;
		menuIcon = 'arrow';
	};

	const unfocusHandler = () => {
		overlay = true;
		menuIcon = 'burger';
	};

	const block = 'menu-list';
	const items = [
		{ img: Group, text: 'New group', className: `${block}__new-group` },
		{ img: User, text: 'Contacts', className: `${block}__user` },
		{ img: Archive, text: 'Archived', className: `${block}__archive` },
		{ img: Savedmessages, text: 'Saved', className: `${block}__saved` },
		{ img: Settings, text: 'Settings', className: `${block}__settings` },
		{ img: Help, text: 'Help', className: `${block}__help` },
	];

	let active = false;
	const popupHandler = e => {
		e.stopPropagation();
		active = !active;
		console.log(active);
	};
</script>

<nav class="menu">
	<nav
		on:click="{popupHandler}"
		type="checkbox"
		id="menu__checkbox"
		class="menu__checkbox"
	>
		<div class="menu__icon icon">
			<div class="{menuIcon}">
				<div></div>
				<div></div>
				<div></div>
			</div>
		</div>
		{#if active}
			<Popup {popupHandler} class="menu-list">
				{#each items as { img, text, className }}
					<PopupItem class="{className}">
						<img slot="img" src="{img}" alt="" />
						<div slot="text" class="menu-list__text">{text}</div>
					</PopupItem>
				{/each}
			</Popup>
		{/if}
	</nav>
	<div class="menu__search-wrapper">
		<input
			on:blur="{unfocusHandler}"
			on:focus="{focusHandler}"
			type="search"
			id="search"
			class="menu__search"
			placeholder="Search"
			autocomplete="off"
		/>
		<div class="menu__search_active_no">
			{@html Search}
		</div>
		<div class:hide="{overlay}" class="menu__search_overlay">
			<div class="menu__search_active">
				{@html Search}
			</div>
		</div>
	</div>
</nav>
