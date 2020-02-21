<script>
    import { phone, code, focused } from '../stores/input';
    import { router } from '../stores/router';
    import { onMount } from 'svelte';
    import InputCode from '../components/ui-kit/inputs/input-code.svelte';

    onMount(() => {
        setTimeout(() => {
            focused.set('code');
        }, 0);
    })

    code.subscribe(code => {
        if (code.length > 4) {
            router.setRoute('login-password')
        }
    });
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
</style>

<form action="code">
    <h1>{$phone}</h1>
    <div class="hint">We have sent you an SMS with code</div>
    <div class="input-group">
        <InputCode  />
    </div>
</form>