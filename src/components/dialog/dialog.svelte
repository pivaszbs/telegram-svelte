<script>
    import RightTop from './right-top.svelte';
    import RightBottom from './right-bottom.svelte';
    import Avatar from '../avatar.svelte';
    import Ripple from '@smui/ripple'
    export let photo;
    export let count;
    export let title;
    export let text;
    export let time;
    export let pinned;
    export let out;
    export let read;
    export let online;
    export let active;
</script>

<style lang="scss">
    .dialog {
        padding: 4px 8px;
        max-height: 10vh;
        min-height: 60px;
        display: grid;
        grid-template-columns: 60px 1fr 60px;
        column-gap: 8px;
        grid-template-rows: 1fr 1fr;
        align-items: center;
        margin: 4px 8px;
        border-radius: 8px;
        user-select: none;

        &:hover {
            background-color: var(--light-gray);
            cursor: pointer;
        }

        &_active {
            background-color: var(--light-gray);
        }

        .avatar-wrapper {
            justify-self: center;
            grid-column: 1;
            grid-row: span 2;
        }

        .name {
            grid-column: 2;
            grid-row: 1;
            font-weight: 600;
            font-size: 16px;
            align-self: flex-end;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }

        .short {
            grid-column: 2/3;
            grid-row: 2;
            align-self: flex-start;
            color: var(--secondary);
            font-size: 16px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;

            &_from {
                color: var(--black);
            }
        }

    &__info {
        grid-row: 1;
        grid-column: 3;
        gap: 4px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-self: right;
    }

    &__time {
        color: var(--secondary);
        font-size: 12px;
        align-self: center;
    }

    .full {
        grid-column: 1/3;
    }

    &__out {
        fill: var(--green);
        align-self: flex-start;
        justify-self: flex-end;
        height: 19px;
    }

    &_right_bottom {
        grid-row: 2;
        grid-column: 3;
        color: var(--white);
        justify-self: flex-end;
        align-self: flex-start;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &_pinned {
        background-color: var(--pinned);
        width: 24px;
        border-radius: 50%;
        svg {
        fill: var(--white);
        }
    }

    &__unread-count {
        border-radius: 24px;
        min-width: 24px;
        color: var(--white);
        font-size: 14px;
        text-align: center;
        background-color: var(--green);
        .count {
        padding: 0 6px;
        }
    }

    &_muted {
        background-color: var(--pinned);
    }
    }

</style>

<div tabindex="0" use:Ripple={{ ripple: true, color: 'secondary' }} class="dialog">
    <div class="avatar-wrapper">
        <Avatar medium {photo} {online} />
    </div>
    <div class="name">{title}</div>
    <div class="short">{text}</div>
    <RightTop {out} {time} {read}/>
    <RightBottom {count} {pinned} />
</div>