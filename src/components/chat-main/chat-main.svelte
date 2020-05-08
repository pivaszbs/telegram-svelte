<script>
	import { messages } from './../../stores/messages.js';
	import Message from '../message/message.svelte';
	$: console.log('qewr', $messages);
</script>

<div class="chat-main">
	<div class="all-messages">
		{#each $messages as message}
			<Message {...message} />
		{/each}
	</div>
</div>

<style lang="scss">
	.chat-main {
		align-self: center;
		align-items: center;
		display: flex;
		flex-direction: column;
		width: 100%;
		position: relative;
		z-index: 1;
		overflow: auto;
		height: 85vh;
		margin-bottom: 45px;

		&::-webkit-scrollbar {
			background-color: transparent;
			&-thumb {
				height: 60px;

				background-color: rgba(0, 0, 0, 0.25);
			}
			&-track {
				background: transparent;
			}
		}

		.all-messages {
			width: 60%;
			height: 100%;
			display: flex;
			flex-direction: column-reverse;
		}
	}

	.date-bubble {
		font-size: 0.9em;
		padding: 3px 10px 3px 10px;
		align-self: center;
		background-color: #999999;
		border-radius: 0.7em;
		text-align: center;
		opacity: 0.7;
		color: #ffffff;
	}
</style>
