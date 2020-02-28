<script>
    import { dialogs } from '../stores/dialogs';
    import Dialog from './dialog/dialog.svelte';
</script>

<style>
    ul {
        list-style: none;
    }
</style>

<ul>
    {#await $dialogs then dialogs}
        {#each dialogs as dialog }
            <Dialog {...dialog} />
        {/each}
    {/await}
</ul>