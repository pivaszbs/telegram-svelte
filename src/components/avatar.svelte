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
	const commonProps = { small, medium, big };
</script>

{#if saved}
	<SavedAvatar {...commonProps} />
{:else if telegram}
	<TelegramAvatar {...commonProps}/>
{:else}
	{#await photo}
		<DefaultAvatar {name} {...commonProps}/>
	{:then avatar}
		<img alt='avatar' src={avatar} />
	{:catch error}
		<!-- photo was rejected -->
	{/await}
{/if}