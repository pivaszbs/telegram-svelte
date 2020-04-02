<script>
	import {
		hideCountryPopup,
		focused,
		hideSubmit,
		phone,
	} from '../stores/input';
	import { countries } from '../stores/popup';
	import { router } from '../stores/router';

	import CountryInput from '../components/ui-kit/inputs/input-country.svelte';
	import PhoneInput from '../components/ui-kit/inputs/input-phone.svelte';
	import CountryPopup from '../components/ui-kit/popups/popup-countries.svelte';
	import Checkbox from '../components/checkbox.svelte';
	import Button from '../components/button.svelte';
	import ClickOutside from '../components/helpers/click-outside.svelte';

	import icon from 'Source/images/logo.png';

	import telegramApi from '../services/TelegramApi';

	let submit;
	let loading = false;
	let elem;

	const onCountryFocus = () => {
		focused.set('country');
	};

	const onClickOutside = () => {
		focused.set('');
	};

	const keyHandler = event => {
		if (event.key === 'Enter' && !$hideSubmit) {
			submit.dispatchEvent(new Event('submit'));
		}
	};

	const submitHandle = event => {
		event.preventDefault();
		if (!$hideSubmit) {
			loading = true;
			telegramApi.profileManager
				.sendCode($phone)
				.then(() => {
					router.setRoute('login-code');
				})
				.catch(err => {
					console.log('ERROR OCCURED', err);
				});
		}
	};
</script>

<svelte:body on:keydown="{keyHandler}" />
<div bind:this="{elem}" class="login-form">
	<img src="{icon}" alt="Telegram logo" class="logo" />
	<h1>Sign in to Telegram</h1>
	<div class="hint">
		Please confirm your country and enter your phone number
	</div>
	<ClickOutside on:clickoutside="{onClickOutside}">
		<div class="input-group country">
			<CountryInput on:focus="{onCountryFocus}" />
			{#if !$hideCountryPopup}
				<CountryPopup countries="{$countries}" />
			{/if}
		</div>
	</ClickOutside>
	<form bind:this="{submit}" on:submit="{submitHandle}" action="login">
		<div class="input-group">
			<PhoneInput />
		</div>
		<div class="keep">
			<Checkbox checked="{true}" name="keep" label="Keep me signed in" />
		</div>
		{#if !$hideSubmit}
			<Button type="submit" variant="primary" {loading}>NEXT</Button>
		{/if}
	</form>
</div>

<style>
	.logo {
		width: 160px;
		margin-bottom: 2vh;
	}

	.login-form {
		display: flex;
		align-items: center;
		flex-direction: column;
		margin-top: 10vh;
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

	.keep {
		font-size: 16px;
		display: flex;
		margin-bottom: 24px;
		width: 360px;
		padding-left: 32px;
		position: relative;

		overflow: hidden;
	}

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
