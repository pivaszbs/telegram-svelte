<script>
    import {phone} from '../../../stores/input';
</script>

<style type="text/scss">
    input {
        box-sizing: border-box;
        width: 360px;
        height: 55px;

        user-select: none;

        border-radius: 10px;
        border: 2px solid var(--border-color);

        font-size: 18px;
        line-height: 55px;

        padding-left: 14px;

        &:focus {
            outline: none;
            border: 2px solid var(--primary);
            caret-color: var(--primary);
        }
    }
</style>
<div class="input-group">
    <input bind:value={$phone} type="phone">
</div>