<script>
    export let count;
    export let pinned;
    export let muted;
</script>

<div class:muted class="right-bottom">
    {#if count > 0}
        <div class="count">{count}</div>
    {:else if pinned}
        <div class="pinned">
            <!-- svg -->
        </div>
    {/if}
</div>
