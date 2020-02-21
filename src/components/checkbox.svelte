<script>
    export let label;
    export let name;
    export let checked = false;
</script>

<style lang="scss">
    input {
        width: 24px;
        height: 24px;
        -webkit-appearance: none;
        background-color: var(--white);
        display: inline-flex;
        align-items: flex-start;
        margin-top: -2px;
        background: url("../icons/empty.svg");

        &:active,
        &:checked:active,
        &:focus {
            outline: none;
        }

        &:checked {
            background: url("../icons/filled.svg");
        }
    }
    
    label {
      display: inline-block;
      margin-left: 32px;
      user-select: none;
      font-size: inherit;
    }
</style>

<input checked={checked} on:change type="checkbox" id={name} {name} >
{#if label}
    <label for={name}>{label}</label>
{/if}