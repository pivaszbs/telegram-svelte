<script>
	import { sanitize } from '../../helpers';
	import read from 'inline/read.svg';
	import notRead from 'inline/notRead.svg';
	export let formattedText,
		entities,
		time,
		out,
		outRead,
		post,
		media,
		withAvatar,
		date;

	$: outIcon = out ? (outRead ? read : notRead) : '';

	$: {
		time = new Date(date * 1000);
		time = `${time.getHours()}:${
			time.getMinutes() > 9 ? time.getMinutes() : '0' + time.getMinutes()
		}`;
	}
</script>

<div class="chat-message">
	<div
		class="message"
		class:chat-message_out="{out}"
		class:chat-message_in="{!out}"
		class:chat-message_post="{post}"
		class:chat-message_full-media="{media}"
		class:chat-message_with_avatar="{withAvatar}"
	>
		{@html formattedText}
		<div
			class="message__info"
			class:message__info_media_no-message="{!formattedText && hasMedia}"
		>
			{time}
			{@html outIcon}
		</div>
	</div>
</div>

<style lang="scss">
	$status-size: 16px;

	.chat-message {
		max-width: 35vw;
		margin: 6px;
		border-radius: 16px;
		display: grid;

		.message {
			min-width: 300px;
			display: inline-block;
			padding: 8px;
			height: min-content;
			border-radius: 16px;
			max-width: 35vw;
			word-break: break-all;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
				Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
				sans-serif;

			&__info {
				float: right;
				transform: translateY(8px);
				color: var(--info-color);
				fill: var(--info-color);
				font-size: 12px;
				margin-left: 8px;

				display: flex;
				align-items: center;
				justify-content: flex-end;
			}
		}
		.document-message {
			.message__info {
				position: absolute;
				float: none;
				bottom: 4px;
				right: 4px;
				transform: none;
				border-radius: 24px;
				background-color: rgba(0, 0, 0, 0.5);
				padding: 0 4px;
				color: var(--white);
			}
		}
		&_full-media {
			grid-template-columns: minmax(min-content, 150px);
			position: relative;

			.message__info_media_no-message {
				position: absolute;
				float: none;
				bottom: 4px;
				right: 4px;
				transform: none;
				border-radius: 24px;
				background-color: rgba(0, 0, 0, 0.5);
				padding: 0 4px;
				color: var(--white);
			}
		}

		&_with {
			&_avatar {
				grid-template-columns: 60px 1fr;

				.chat-message__reply {
					grid-column: 2;
				}

				.message {
					grid-column: 2;
					position: relative;
					border-bottom-left-radius: 0 !important;

					&::after {
						background: url('~images/message-in-tail.svg');
						position: absolute;
						left: -9px;
						content: '';
						width: 11px;
						height: 20px;
						bottom: -1px;
					}
				}
			}
		}

		&_without {
			&_message {
			}
		}

		&__avatar {
			position: sticky;
			bottom: 0;
			align-self: flex-end;
			grid-column: 1;
			grid-row: 1/3;
		}

		&_sticker {
			background-color: transparent;
			border-radius: 0;
		}

		&__reply {
			background-color: var(--message-background);
			padding-left: 10px;
			border-radius: 16px 16px 0 0;
			.reply-field {
				cursor: pointer;
				border-left: 2px solid var(--reply-color);
				padding: 0 4px;
				margin-top: 8px;
				margin-right: 4px;
				&__title {
					color: var(--reply-color);
				}
			}

			& + .message {
				border-top-left-radius: 0;
				border-top-right-radius: 0;
			}
		}

		&_in {
			--message-background: var(--white);
			--info-color: var(--gray);
			--reply-color: var(--primary);
			align-self: flex-start;
		}

		&_out {
			--message-background: var(--light-green);
			--info-color: var(--green);
			--reply-color: var(--green);
			align-self: flex-end;
			position: relative;

			.message {
				border-bottom-right-radius: 0 !important;
				&::after {
					background: url('~images/message-out-tail.svg');
					position: absolute;
					right: -9px;
					content: '';
					width: 11px;
					height: 20px;
					bottom: -1px;
					transform: rotateY(180deg);
				}
			}
		}

		.message-content {
			align-self: flex-start;
			white-space: pre-wrap;
			word-wrap: break-word;
			word-break: break-all;
			flex: auto;
			padding-left: 5px;
			font-size: 0.9em;
			padding-top: 5px;
		}

		.message-info {
			display: flex;
			flex-direction: row;
			align-self: flex-end;
			color: var(--info-color);
			margin-left: 5px;
		}

		.message-time {
			position: relative;
			bottom: -5px;
			font-size: 0.7em;
		}

		.status {
			position: relative;
			right: -2px;
			bottom: -4px;
			width: $status-size;
			height: $status-size;
			fill: var(--green);
			background-size: $status-size $status-size;
		}

		.sending {
			background: url('~images/sending.svg') no-repeat;
			background-size: $status-size $status-size;
		}

		.sending-error {
			background: url('~images/sending-error.svg') no-repeat;
			background-size: $status-size $status-size;
		}

		.check-sent {
			background: url('~images/check-sent.svg') no-repeat;
			background-size: $status-size $status-size;
		}

		.check-read {
			background: url('~images/check-read.svg') no-repeat;
			background-size: $status-size $status-size;
		}
	}

	.chat-message_post_out_last {
	}

	.chat-message_post_in_last {
	}

	.chat-message__photo-media {
		border-top-left-radius: 16px;
		border-top-right-radius: 16px;
		overflow: hidden;
		display: flex;
		justify-content: center;
		padding-bottom: 0;
		padding-top: 0;

		background-color: var(--black);

		&_with_message + .message {
			border-radius: 0 0 16px 16px;
			border-bottom-left-radius: 16px;
			border-bottom-right-radius: 16px;
		}

		&:not(&_with_message) {
			border-bottom-left-radius: 16px;
			border-bottom-right-radius: 16px;

			position: relative;
		}
	}

	.chat-message_media-unsupported {
	}

	.chat-message_emoji {
		font-size: 80px;
	}

	.chat-message_animated-sticker {
		width: 200px;
		height: 200px;
	}

	.message {
		white-space: pre-wrap;
		padding: 4px;

		background-color: var(--message-background);
	}

	.chat-message_sticker {
		max-width: 300px;
		max-height: 300px;
		border-radius: 16px;
	}

	.document-message__video {
		overflow: hidden;
		border-radius: 10px;

		&_round {
			border-radius: 50%;
		}
	}

	.document-message__document {
		cursor: pointer;
		user-select: none;
		padding-top: 5px;
		padding-bottom: 10px;
		padding-left: 10px;
		padding-right: 10px;
		border-radius: 16px;

		svg {
			position: relative;
			text-align: center;
		}

		.doc {
			&_mime {
				top: 50%;
				width: 54px;
				transform: translateY(-100%);
				color: var(--white);
				position: absolute;
				text-align: center;
				font-size: 16px;
				font-weight: 600;
			}

			&_pdf {
				#Paper {
					fill: #df3f40;
				}

				#Flipped {
					fill: #b9191a;
				}
			}

			&_doc {
				#Paper {
					fill: #50a2e9;
				}

				#Flipped {
					fill: #2a7cc3;
				}
			}

			&_jpeg,
			&_jpg {
				fill: var(--black);
			}

			&_zip,
			&_rar {
				fill: #fb8c00;
			}
		}

		background-color: var(--message-background);
	}
</style>
