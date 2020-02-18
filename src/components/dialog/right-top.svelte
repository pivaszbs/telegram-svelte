<script>
    export let time;
    export let out;
    export let read;
</script>

<div class="right-top">
    {#if out}
        <div class="out">
            {#if read}
                 <!-- svg -->
            {:else}
                 <!-- another svg -->
            {/if}
        </div>
    {/if}
    <div class="time">{time}</div>
</div>