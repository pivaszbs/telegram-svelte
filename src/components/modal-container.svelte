<script>
    import ClickOutside from './helpers/click-outside.svelte';
    import { afterUpdate } from 'svelte';
    export let destroy = () => {};
    let container; 

    const onClick = () => {
        destroy();
    }
</script>

<style>
    .modal-container {
        position: absolute;
        height: 100vh;
        width: 100vw;
        background: transparent;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .paranja {
        position: absolute;
        z-index: -1;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
    }
</style>

<div bind:this={container} class="modal-container">
    <div on:click={onClick} class="paranja"></div>
    <slot></slot>
</div>