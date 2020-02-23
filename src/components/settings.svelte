<script>
    import SettingsHeader from '../components/ui-kit/sidebar/sidebar-header.svelte'
    import SettingsInfo from '../components/ui-kit/sidebar/sidebar-info.svelte'
</script>

<div class="sidebar sidebar_left settings">
    <SettingsHeader/>
    <SettingsInfo/>


<ul class="settings-list">
	<li class="settings-list__item settings-list__edit">
		<img src="./icons/edit.svg" alt="">
		<div class="settings-list__text">Edit profile</div>
	</li>
	<li class="settings-list__item settings-list__general-settings">
		<img src="./icons/settings.svg" alt="">
		<div class="settings-list__text">General settings</div>
	</li>
	<li class="settings-list__item settings-list__notifications">
		<img src="./icons/unmute.svg" alt="">
		<div class="settings-list__text">Notifications</div>
	</li>
	<li class="settings-list__item settings-list__privacy">
		<img src="./icons/lock.svg" alt="">
		<div class="settings-list__text">Privacy and security</div>
	</li>
	<li class="settings-list__item settings-list__language">
		<img src="./icons/language.svg" alt="">
		<div class="settings-list__text">Language</div>
	</li>
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
