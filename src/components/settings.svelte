<script>
	import { fly } from 'svelte/transition';
	import SettingsItem from './settings-item.svelte';
	import Edit from './../assets/images/edit.svg';
	import Notifications from './../assets/images/notifications.svg';
	import Language from './../assets/images/language.svg';
	import Privacy from './../assets/images/privacy.svg';
	import Settings from './../assets/images/settings.svg';
	import SettingsHeader from '../components/ui-kit/sidebar/sidebar-header.svelte';
	import SettingsInfo from '../components/ui-kit/sidebar/sidebar-info.svelte';

	const listItems = [
		{ icon: Edit, text: 'Edit profile', class: 'edit' },
		{ icon: Settings, text: 'General settings', class: 'settings' },
		{ icon: Notifications, text: 'Notifications', class: 'notifications' },
		{ icon: Privacy, text: 'Privacy and security', class: 'privacy' },
		{ icon: Language, text: 'Language', class: 'language' },
	];
</script>

<div
	transition:fly="{{ duration: 200, x: -200 }}"
	class="sidebar sidebar_left settings"
>
	<SettingsHeader />
	<SettingsInfo />
	<ul class="settings-list">
		{#each listItems as item}
			<SettingsItem {...item} />
		{/each}
	</ul>
</div>

<style lang="scss">
	.sidebar {
		position: absolute;
		height: 100%;
		background: var(--white);
		z-index: 10;
	}

	.settings {
		display: grid;
		grid-template-columns: 60px auto 60px;
		grid-template-rows: 60px 150px 2fr;

		&__avatar {
			margin-bottom: var(--indent-x-large);
			overflow: hidden;
		}

		&__name {
			font-size: var(--font-size-large);
			font-weight: 600;
			margin-bottom: var(--indent-small);
		}

		&__phone {
			font-size: var(--font-size-small);
			color: var(--gray);
		}

		.settings-list {
			grid-row: 3;
			grid-column: 1/4;
		}

		.more-list {
			position: absolute;
			top: 50px;
			right: 10px;
		}
	}
</style>
