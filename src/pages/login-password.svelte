<script>
    import { phone, code, focused } from '../stores/input';
    import { router } from '../stores/router';
    import { onMount } from 'svelte';
    import InputPassword from '../components/ui-kit/inputs/input-password.svelte';
    import Button from '../components/button.svelte';

    let loading = false;
    
    onMount(() => {
        focused.set('password');
    })

    const submitHandle = event => {
        event.preventDefault();
        loading = true;
    }
</script>

<style>
    .hint {
		color: var(--dark-gray);
		font-weight: 400;
		font-size: 16px;
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
        margin-bottom: 24px;
    }
</style>

<form on:submit={submitHandle} action="password">
    <h1>Enter a password</h1>
    <div class="hint">We have sent you an SMS with code</div>
    <div class="input-group">
        <InputPassword  />
    </div>
    <Button type="submit" variant="primary" {loading}>NEXT</Button>`
</form>