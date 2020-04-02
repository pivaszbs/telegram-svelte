<script>
	import PopupItem from './../popup-item/popup-item.svelte';
	import Popup from './../popup/popup.svelte';
	import Help from 'images/help.svg';
	import Settings from 'images/settings.svg';
	import Savedmessages from 'images/savedmessages.svg';
	import Archive from 'images/archive.svg';
	import User from 'images/user.svg';
	import Group from 'images/group.svg';

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
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
				<path
					fill-rule="nonzero"
					d="M9.5,3 C13.0898509,3 16,5.91014913 16,9.5 C16,10.9337106
					15.5358211,12.2590065 14.7495478,13.3338028
					L19.7071068,18.2928932 C20.0976311,18.6834175
					20.0976311,19.3165825 19.7071068,19.7071068
					C19.3466228,20.0675907 18.7793918,20.0953203
					18.3871006,19.7902954 L18.2928932,19.7071068
					L13.3338028,14.7495478 C12.2590065,15.5358211 10.9337106,16
					9.5,16 C5.91014913,16 3,13.0898509 3,9.5 C3,5.91014913
					5.91014913,3 9.5,3 Z M9.5,5 C7.01471863,5 5,7.01471863 5,9.5
					C5,11.9852814 7.01471863,14 9.5,14 C11.9852814,14
					14,11.9852814 14,9.5 C14,7.01471863 11.9852814,5 9.5,5 Z"
				></path>
			</svg>
		</div>
		<div class:hide="{overlay}" class="menu__search_overlay">
			<div class="menu__search_active">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
					<path
						fill-rule="nonzero"
						d="M9.5,3 C13.0898509,3 16,5.91014913 16,9.5
						C16,10.9337106 15.5358211,12.2590065
						14.7495478,13.3338028 L19.7071068,18.2928932
						C20.0976311,18.6834175 20.0976311,19.3165825
						19.7071068,19.7071068 C19.3466228,20.0675907
						18.7793918,20.0953203 18.3871006,19.7902954
						L18.2928932,19.7071068 L13.3338028,14.7495478
						C12.2590065,15.5358211 10.9337106,16 9.5,16
						C5.91014913,16 3,13.0898509 3,9.5 C3,5.91014913
						5.91014913,3 9.5,3 Z M9.5,5 C7.01471863,5 5,7.01471863
						5,9.5 C5,11.9852814 7.01471863,14 9.5,14 C11.9852814,14
						14,11.9852814 14,9.5 C14,7.01471863 11.9852814,5 9.5,5 Z"
					></path>
				</svg>
			</div>
		</div>

	</div>
</nav>
