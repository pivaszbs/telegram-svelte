<script>
    import CountryInput from '../components/ui-kit/inputs/input-country/input-country.svelte';
    import PhoneInput from '../components/ui-kit/inputs/input-phone.svelte';
    import CountryPopup from '../components/ui-kit/popups/popup-countries.svelte';
    import Checkbox from '../components/checkbox.svelte';
    import Button from '../components/button.svelte';
</script>

<div class="login-page">
	<div class="login-form">
		<img src="../../static/images/logo.png" alt="Telegram logo" class="login-form__icon">
		<h1 class="login-form__title">Sign in to Telegram</h1>
		<h3 class="login-form__description">Please confirm your country and enter your phone number</h3>
		<CountryInput />
        <PhoneInput />
        <Checkbox />
        <Button variant="primary">NEXT</Button>
	</div>
</div>