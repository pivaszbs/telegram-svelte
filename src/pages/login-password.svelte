<script>
	import { phone, code, focused, password } from '../stores/input';
	import { router } from '../stores/router';
	import { onMount } from 'svelte';
	import InputPassword from '../components/ui-kit/inputs/input-password.svelte';
	import Button from '../components/button.svelte';
	import telegramApi from '../services/TelegramApi';

	let loading = false;

	onMount(() => {
		focused.set('password');
	});

	const submitHandle = event => {
		event.preventDefault();
		loading = true;
		telegramApi.profileManager
			.signIn2FA($password)
			.then(res => {
				router.setRoute('chat-page');
			})
			.catch(err => {
				console.log('ERROR OCCURED', err);
			});
	};
</script>

<form on:submit="{submitHandle}" action="password">
	<h1>Enter a password</h1>
	<div class="hint">We have sent you an SMS with code</div>
	<div class="input-group">
		<InputPassword />
	</div>
	<Button type="submit" variant="primary" {loading}>NEXT</Button>
	`
</form>

<style>
	.hint {
		color: var(--dark-gray);
		font-weight: 400;
		font-size: var(--font-size-medium);
		width: 50%;
		margin-bottom: 4vh;
	}

	form {
		display: flex;
		align-items: center;
		flex-direction: column;
		margin-top: 25vh;
		width: 400px;
		text-align: center;
	}

	.input-group {
		margin-bottom: var(--indent-xx-large);
	}
</style>
