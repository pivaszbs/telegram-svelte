<script>

</script>

<message-input class="message-input">
	<div class="text-input">
		<div class="svg emoji-set"></div>
		<div
			contenteditable="true"
			class="text-input__input"
			placeholder="Message"
		></div>
		<div class="svg attach-media"></div>
	</div>
</message-input>

<style lang="scss">
	.message-input {
		height: auto;
		position: fixed; //absolute? nope
		bottom: 20px;
		display: grid;
		grid-template-columns: 1fr 60px;
		column-gap: 10px;
		width: calc(55% - 10vw);
		min-width: 400px;

		&_small {
			width: calc(55% - var(--right-sidebar-width));
		}

		svg {
			width: 60px;
			height: 60px;
		}

		.popup {
			transition: max-height 0.2s ease-in, width 0.2s ease-in;
			overflow: hidden;

			width: 420px;
			max-height: 500px;
		}

		.popup_hidden {
			width: 0;
			max-height: 0;
		}
	}

	.text-input {
		position: relative; //for xvostik
		display: grid;
		grid-template-columns: 60px 1fr 60px;
		place-items: center;
		background-color: var(--white);
		border-radius: 0.5em 0.5em 0 0.5em;
		overflow: scroll;
		overflow-x: hidden;
		max-height: 300px;

		&::-webkit-scrollbar {
			position: absolute;
			right: 200px;
			transform: translateX(-20px);
			margin-right: 20px;
			padding-right: 20px;
		}

		// &:after {
		//   content: " ";
		//   position: absolute;
		//   right: -15px;
		//   border: 20px solid transparent;
		//   border-left-color: var(--white);
		//   border-right: 0;
		//   border-bottom: 0;
		//   bottom: 0;
		// }

		&__input {
			border: 0 solid transparent;
			width: 100%;
			min-height: 15px;
			outline: none;
			overflow: hidden;
			// white-space: normal;

			&::before {
				//copypaste from web telega
				content: attr(placeholder);
				color: #9aa2ab;
				display: block;
				margin-top: -1px;
				margin-left: 1px;
				pointer-events: none;
			}
		}
	}
	.attach-media {
		&__popup {
			right: 55px;
			bottom: 65px;
			max-width: 200px;

			.popup-item {
				cursor: pointer;
				justify-content: flex-start;
				width: 200px;
			}
		}

		&__img {
			width: 24px;
			height: 24px;
			padding-right: 25px;
		}
	}

	.voice-message {
		cursor: pointer;
		background-color: white;
		padding: 16px !important;
		border-radius: 50%;
		fill: var(--white);

		& svg {
			opacity: 1 !important;
		}
	}

	$send-button-size: 26px;

	.microphone,
	.send-arrow {
		width: $send-button-size;
		height: $send-button-size;
	}

	.microphone {
		background: url('./microphone.svg') no-repeat;
	}

	.send-arrow {
		background: url('./sendArrow.svg') no-repeat;
	}

	.svg {
		align-self: end;
		svg {
			cursor: pointer;
			width: 24px;
			height: 24px;
			opacity: 0.5;
			position: fixed;
			bottom: 35px;
			transform: translateX(-10px);
			&.active {
				fill: var(--primary);
				opacity: 0.7;
			}
		}
	}

	.emoji__popup {
		bottom: 63px;

		.tabs {
			display: grid;
			grid-template-columns: repeat(3, 25%);
			grid-template-rows: 40px 10px;
			align-items: center;
			justify-items: center;
			justify-content: space-around;
			position: relative;
		}

		.tab {
			cursor: pointer;
			color: var(--dark-gray);
			margin-top: 10px;
			font-size: 16px;
			font-weight: bold;

			&_active {
				color: var(--primary);
			}
		}

		.underline {
			display: block;
			width: 60%;
			background: var(--primary);
			border-radius: 20px;
			height: 0.5vh;
			z-index: 1;
			transition: all 0.4s ease-in;
			grid-row: 2;
			grid-column: 1;
		}

		.gray-line {
			grid-column: 1/4;
			grid-row: 2;
			border-bottom: 1px solid var(--gray);
			width: 135%;
			transform: translateY(2px);
		}

		.emoji__content {
			font-size: 28px;
			display: grid;
			gap: 2px;
			grid-template-columns: repeat(9, 1fr);
			padding: 8px;
		}

		.emoji_element {
			border-radius: 8px;
			padding: 4px;
			&:hover {
				background: var(--light-gray);
			}
			cursor: pointer;
		}

		.emoji-set {
			&_active {
				svg {
					fill: var(--primary);
				}
			}
		}

		.tabs__content_stickers {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			overflow: scroll;
			height: 280px;
		}
	}

	.sticker_element {
		cursor: pointer;
	}
</style>
