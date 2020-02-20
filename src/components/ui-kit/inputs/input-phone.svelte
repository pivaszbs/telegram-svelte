<script>
    import {phone, focused} from '../../../stores/input';

    const onFocus = () => {
        focused.set('phone');
    }
</script>

<style type="text/scss">
</style>

<input required bind:value={$phone} on:focus={onFocus} type="phone">
<label for="phone">Phone Number</label>