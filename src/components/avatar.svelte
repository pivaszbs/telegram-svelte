<script>
	import DefaultAvatar from '../components/ui-kit/avatars/avatar-default.svelte';
	import SavedAvatar from '../components/ui-kit/avatars/avatar-saved.svelte';
	import TelegramAvatar from '../components/ui-kit/avatars/avatar-telegram.svelte';
	export let photo;
	export let name;
	export let saved;
	export let telegram;
	export let small;
	export let medium;
	export let big;
	export let online;
	const commonProps = { small, medium, big };
</script>

<style lang="scss">
	.avatar {
		border-radius: 50%;
	}
	.medium {
		width: 54px;
		height: 54px;
	}
	 .online {
        position: relative;
        &::before {
            position: absolute;
            content: "";
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

{#if saved}
	<SavedAvatar {...commonProps} />
{:else if telegram}
	<TelegramAvatar {...commonProps}/>
{:else}
	{#await photo}
		<DefaultAvatar {name} {...commonProps}/>
	{:then avatar}
		{@debug avatar}
		{#if avatar}
			<img class='avatar'  class:medium={medium} class:online={online} alt='avatar' src={avatar} />
		{:else}
			<DefaultAvatar {name} {...commonProps}/>
		{/if}
	{:catch error}
		<DefaultAvatar {name} {...commonProps}/>
	{/await}
{/if}