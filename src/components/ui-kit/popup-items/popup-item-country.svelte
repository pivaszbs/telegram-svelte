<script>
	import emojiFlags from 'emoji-flags';
	import { country, focused, hideCountryPopup } from '../../../stores/input';
	export let name;
	export let alpha;
	export let code;
	export let active = false;

	const onItemClick = () => {
		country.set(name);
		focused.set('phone');
	};
</script>

<li on:click="{onItemClick}" class:active>
	<span class="popup-item__flag">
		{emojiFlags[alpha] ? emojiFlags[alpha].emoji : 'NONE'}
	</span>
	<span class="popup-item__name">{name}</span>
	<span class="popup-item__code">{code}</span>
</li>

<style lang="scss">
	li {
		display: flex;
		justify-content: space-between;
		cursor: pointer;
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		background: var(--white);

		height: 50px;
		min-height: 50px;
		width: 360px;
		padding-left: 15px;
		padding-right: 15px;
		vertical-align: middle;
		&:hover {
			background: var(--light-gray);
		}
	}
	span {
		display: inline-block;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.active {
		background: var(--light-gray);
	}
</style>
