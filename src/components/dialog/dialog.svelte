<script>
    import RightTop from './right-top.svelte';
    import RightBottom from './right-bottom.svelte';
    export let avatar;
    export let count;
    export let name;
    export let short;
    export let time;
    export let pinned;
    export let out;
    export let read;
</script>

<div class="dialog">
    <div class="avatar"></div>
    <div class="name">{name}</div>
    <div class="short">{short}</div>
    <RightTop {out} {read}/>
    <RightBottom {time} {pinned} />
</div>