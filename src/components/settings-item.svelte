<script>
	let className;
	export let icon, text;
	export { className as class };
</script>

<li class="{`settings-list__item settings-list__${className}`}">
	<img src="{icon}" />
	<div class="settings-list__text">{text}</div>
</li>

<style lang="scss">
	.settings-list {
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
			}

			&:hover {
				background-color: var(--light-gray);
				cursor: pointer;
			}
		}
		&__text {
			font-size: 14px;
			padding-left: 20px;
		}
	}
</style>
