<script>
	import ChatMain from './../components/chat-main/chat-main.svelte';
	import MessageInput from './../components/message-input.svelte';
	import TopBar from './../components/top-bar/top-bar.svelte';
	import Menu from './../components/menu/menu.svelte';
	import UserDialogs from '../components/user-dialogs.svelte';
</script>

<div class="chat-page">
	<div class="left">
		<Menu />
		<UserDialogs />
	</div>
	<div class="right">
		<TopBar />
		<ChatMain />
		<MessageInput />
	</div>
</div>

<style lang="scss">
	.chat-page {
		width: 100%;
		display: flex;
		overflow: hidden;
		width: 100%;
		height: 100%;
		min-height: 0;
	}
	.left {
		width: 25vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		min-width: 260px;
		border-right: 1px solid #e6ebee;
	}

	.right {
		position: relative;
		min-width: 600px;
		width: 75vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		transition: 0.1s;

		&::after {
			position: absolute;
			left: 0;
			right: 0;
			content: '';
			width: 100%;
			height: 100%;
			z-index: -1;
			background-position: center;
			background-repeat: no-repeat;
			background-size: cover;
			background-image: url('~images/BG.jpg');
		}
	}
</style>
