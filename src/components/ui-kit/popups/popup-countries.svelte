<script>
    import { hideCountryPopup } from '../../../stores/input';
    import PopupItemCountry from '../popup-items/popup-item-country.svelte';
    import { countries } from '../../../stores/popup';
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
<div class="popup" class:hide={$hideCountryPopup}>
    <ul>
        {#each $countries as country}
            <PopupItemCountry {...country} />
        {/each}
    </ul>
</div>