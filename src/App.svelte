<script>
	import Button from './components/button.svelte';
	import Loader from './components/loader.svelte';
	import Avatar from './components/avatar.svelte';
	import LoginForm from './pages/login-form.svelte';
  export let name;
  const handler = () => console.log('hello123');
</script>

<style>
.avatar {
	width: 54px;
	height: 54px;
}
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


  </style>

<main>
	<LoginForm />
</main>
