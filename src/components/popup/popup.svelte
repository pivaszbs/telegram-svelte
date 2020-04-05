<script>
	import { clsx } from './../../helpers/index.js';
    import { fly } from 'svelte/transition';

    let className;
    export { className as class }
</script>

<style lang="scss">
    .popup {
        display: flex;
        flex-direction: column;
        position: absolute;
        z-index: 100;
        top: calc(100% + 10px);
        border-radius: 12px;
        max-width: 360px;
        max-height: 280px;
        overflow: auto;
        overflow-x: hidden;
        box-shadow: -2px 10px 26px -7px var(--shadow);
        background: white;

        &::-webkit-scrollbar {
            width: 0 !important;
        }
    }
    ul {
        list-style: none;
        margin: 0;
        padding: 0;
        padding-inline: 0;
    }

    .hide {
        display: none;
    }
</style>

<ul on:keydown transition:fly={{ duration: 200, y: 20 }} class={clsx("popup", className)}>
    <slot></slot>   
</ul>
