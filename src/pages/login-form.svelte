<script>
	import { onMount } from 'svelte';
	import { hideCountryPopup, focused } from '../stores/input';

	import CountryInput from '../components/ui-kit/inputs/input-country.svelte';
	import PhoneInput from '../components/ui-kit/inputs/input-phone.svelte';
	import CountryPopup from '../components/ui-kit/popups/popup-countries.svelte';
	import Checkbox from '../components/checkbox.svelte';
	import Button from '../components/button.svelte';
	import ClickOutside from '../components/helpers/click-outside.svelte';

	const onCountryFocus = () => {
		focused.set('country');
	}

	const onClickOutside = () => {
		focused.set('');
	}
</script>

<style>
	.logo {
		width: 160px;
		margin-bottom: 2vh;
	}

	.login-page {
		height: 100vh;
		display: flex;
		justify-content: center;
	}

	.login-form {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		height: 100%;
		width: 400px;
		text-align: center;
	}

	.hint {
		color: var(--dark-gray);
		font-weight: 400;
		font-size: 16px;
		width: 75%;
		margin-bottom: 4vh;
	}

	.input-group {
		margin-bottom: 24px;
	}

	.country {
		position: relative;
	}
</style>

<div class="login-page">
	<form class="login-form">
		<img src="./images/logo.png" alt="Telegram logo" class="logo">
		<h1>Sign in to Telegram</h1>
		<div class="hint">Please confirm your country and enter your phone number</div>
		<ClickOutside on:clickoutside={onClickOutside} >
			<div class="input-group country">
				<CountryInput on:focus={onCountryFocus} />
				<CountryPopup />
			</div>
		</ClickOutside>
		<div class="input-group">
			<PhoneInput />
		</div>
		<Checkbox />
		<Button type="submit" variant="primary">NEXT</Button>
	</form>
</div>