<script>
    import {country} from '../../../../stores/input';
</script>

<style type="text/scss">
    .input-group {
        display: flex;
        align-items: center;
        position: relative;
        width: 360px;
        height: 54px;
        .icon {
            width: 28px;
            height: 28px;
            position: absolute;
            right: 16px;
            display: flex;
            align-items: center;

            .line {
                transition: transform 0.1s ease-in;
                position: absolute;
                height: 3px;
                width: 16px;
                background-color: #dadce0;
                border-radius: 4px;
                &:first-child {
                    left: 2px;
                    transform: rotate(45deg);
                }

                &:last-child {
                    right: 1px;
                    transform: rotate(-45deg)
                }
            }
        }
    }
    input {
        box-sizing: border-box;
        width: 100%;
        height: 100%;

        user-select: none;

        border-radius: 12px;
        border: 2px solid var(--border-color);

        font-size: 18px;
        line-height: 100%;

        padding-left: 12px;

        &:focus {
            outline: none;
            border: 2px solid var(--primary);
            caret-color: var(--primary);
        }
    }

    input:focus ~ .icon {
        .line {
            &:first-child {
                transform: rotate(-45deg);
            }
            &:last-child {
                transform: rotate(45deg);
            }
        }
    }
</style>
<div class="input-group">
    <input bind:value={$country} type="country">
    <div class="icon">
        <div class="line"></div>
        <div class="line"></div>
    </div>
</div>