<script>
	import LoginForm from './pages/login-form.svelte';
	import LoginCode from './pages/login-code.svelte';
	import LoginPassword from './pages/login-password.svelte';
	import RegisterPage from './pages/register-page.svelte';
	import ChatPage from './pages/chat-page.svelte';
	import ProfileImage from './components/profile-image.svelte';
	import { router } from './stores/router';
	import telegramApi from './services/TelegramApi';
	
	const routes = {
		'login-form': LoginForm,
		'login-code': LoginCode,
		'register-page': RegisterPage,
		'login-password': LoginPassword,
		'chat-page': ChatPage
	};

	telegramApi.getUserInfo().then(data => {
		if (data.id) {
			router.setRoute('chat-page')
		} else {
			router.setRoute('login-form');
		}
	})

</script>

<style>
	:root {
		--primary: rgb(79, 164, 246);
		--secondary: #777b7f;
		--gray: #9e9e9e;
		--light-gray: #f5f5f5;
		--right-gray: #eee;
		--dark-gray: rgb(106, 108, 111);
		--gray-300: #e0e0e0;
		--pinned: #c4c9cc;

		--green: #4dcd5e;
		--shadow: rgba(0, 0, 0, 0.75);
		--white: #fff;
		--red: rgb(197, 59, 57);
		--black: #000;
		--light-green: #eeffdf;
		--border-color: rgba(218, 220, 224, 0.75);


		--ripple-background: var(--black);
		--ripple-opacity: 0.08;
		--ripple-duration: 600ms;
	}

	main {
		display: flex;
		justify-content: center;
		height: 100vh;
	}
</style>

<main>
	<svelte:component this={routes[$router.route]} {...$router.props} />
</main>