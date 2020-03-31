<script>
	import SettingsItem from './settings-item.svelte';
	import Edit from './../assets/images/edit.svg';
	import Notifications from './../assets/images/notifications.svg';
	import Language from './../assets/images/language.svg';
	import Privacy from './../assets/images/privacy.svg';
	import Settings from './../assets/images/settings.svg';
    import SettingsHeader from '../components/ui-kit/sidebar/sidebar-header.svelte'
    import SettingsInfo from '../components/ui-kit/sidebar/sidebar-info.svelte'
    
    const listItems = [
        {icon: Edit, text: "Edit profile", class: "edit"},
        {icon: Settings, text: "General settings", class: "settings"},
        {icon: Notifications, text: "Notifications", class: "notifications"},
        {icon: Privacy, text: "Privacy and security", class: "privacy"},
        {icon: Language, text: "Language", class: "language"},
    ]
</script>

<div class="sidebar sidebar_left settings">
    <SettingsHeader/>
    <SettingsInfo/>
    <ul class="settings-list">
        {#each listItems as item}
            <SettingsItem {...item}/>
        {/each}
    </ul>
</div>

<style lang="scss">
    .sidebar {
    position: absolute;
    height: 100%;
    background: var(--white);
    z-index: 10;

    &_left {
        left: 0;
    }
    &_hidden {
        left: -100%;
    }
    left: 0;
    transition: 0.4s;

    }

    .settings {
    display: grid;
    grid-template-columns: 60px auto 60px;
    grid-template-rows: 60px 150px 2fr;

    &__avatar {
        margin-bottom: 20px;
        overflow: hidden;
    }

    &__name {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 4px;
    }

    &__phone {
        font-size: 14px;
        color: var(--gray);
    }

    .settings-list {
        grid-row: 3;
        grid-column: 1/4;

        &__item {
        max-height: 10vh;
        min-height: 50px;
        display: flex;
        align-items: center;
        margin: 0 8px;
        padding-left: 8px;
        border-radius: 8px;
        justify-content: flex-start;
        width: 23.5vw;
        min-width: 230px;

            img {
                width: 24px;
                height: 24px;
                padding-right: 25px;
            }

            &:hover {
                background-color: var(--light-gray);
                cursor: pointer;
            }
        }
        &__text {
        font-size: 14px;
        }
    }

    .more-list {
        position: absolute;
        top: 50px;
        right: 10px;
    }
    }
</style>
