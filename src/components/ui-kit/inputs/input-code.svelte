<script>
    import { code, focused } from '../../../stores/input';

    let elem;

    $: $focused === 'code' && elem.focus();

    const onFocus = () => {
        focused.set('code');
    }
</script>

<input bind:this={elem} on:change bind:value={$code} type="text" name="code" id="code" required>
<label>Code</label>