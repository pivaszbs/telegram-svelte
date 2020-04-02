<script>
	import More from './../../assets/images/more.svg';
	import Search from 'images/search.svg';
	import { user } from './../../stores/user.js';
	import { loadStatus } from './status-helpers.js';
	import { dialogs } from './../../stores/dialogs.js';
	import Avatar from './../avatar/avatar.svelte';
	import './top-bar.scss';
	$: console.log($user);
	$: console.log('dialogs', $dialogs);
</script>

{#if $dialogs[1]}
	<div class="top-bar">
		<Avatar small photo="{$dialogs[1].photo}" title="{$dialogs[1].title}" />
		<div class="name">{$dialogs[1].title}</div>
		<div class="top-bar__search icon">
			<img src="{Search}" />
		</div>
		<div class="top-bar__more icon">
			<img src="{More}" />
		</div>
	</div>
{/if}
