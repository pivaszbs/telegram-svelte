<script>
	import { fade } from 'svelte/transition';
    import PopupItemCountry from '../popup-items/popup-item-country.svelte';
    import { country, focused } from '../../../stores/input';
    export let countries;
    let active = -1
    const keyHandler = event => {
        switch (event.key) {
            case 'ArrowDown':
                active++;
                break;
            case 'ArrowUp':
                active--;
                break;
            case 'Enter':
                if (countries[active]) {
                    country.set(countries[active].name);
                    focused.set('phone');
                }
                break;
        }
    }
</script>

<style lang="scss">
    .popup {
        position: absolute;
        z-index: 100;
        top: calc(100% + 10px);
        border-radius: 12px;
        max-width: 360px;
        max-height: 280px;
        overflow: auto;
        overflow-x: hidden;
        box-shadow: -2px 10px 26px -7px var(--shadow);

        &::-webkit-scrollbar {
            width: 0 !important;
        }
    }

    ul {
        list-style: none;
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        padding-inline: 0;

        & img {
            height: 40px;
        }
    }

    .hide {
        display: none;
    }
</style>

<svelte:body on:keydown={keyHandler} />
<div on:keydown={keyHandler} transition:fade={{ duration: 200 }} class="popup">
    <ul>
        {#each countries as country, i}
            {#if i === active}
                <PopupItemCountry {...country} active />
            {:else}
                <PopupItemCountry {...country} />
            {/if}
        {/each}
    </ul>
</div>