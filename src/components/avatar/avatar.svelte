<script>
	import DefaultAvatar from '../ui-kit/avatars/avatar-default.svelte';
	import SavedAvatar from '../ui-kit/avatars/avatar-saved.svelte';
	import TelegramAvatar from '../ui-kit/avatars/avatar-telegram.svelte';
	import './avatar.scss';
	export let photo;
	export let title;
	export let saved;
	export let telegram;
	export let small;
	export let medium;
	export let big;
	export let online;
	const commonProps = { small, medium, big, online };
</script>

{#if saved}
	<SavedAvatar {...commonProps} />
{:else if telegram}
	<TelegramAvatar {...commonProps} />
{:else}
	{#await photo}
		<DefaultAvatar {title} {...commonProps} />
	{:then avatar}
		{#if avatar}
			<img
				class="avatar"
				src="{avatar}"
				class:online
				class:small
				class:medium
				class:big
				alt="avatar"
			/>
		{:else}
			<DefaultAvatar {title} {...commonProps} />
		{/if}
	{:catch error}
		<DefaultAvatar {title} {...commonProps} />
	{/await}
{/if}

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
</style>
