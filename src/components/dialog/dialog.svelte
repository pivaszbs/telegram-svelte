<script>
    import RightTop from './right-top.svelte';
    import RightBottom from './right-bottom.svelte';
    import Avatar from '../avatar.svelte';
    import Ripple from '@smui/ripple';

    export let photo;
    export let count;
    export let name;
    export let short;
    export let time;
    export let pinned;
    export let out;
    export let read;
    export let online;
</script>

<li use:Ripple={{ ripple: true, color: 'secondary' }} class="dialog">
    <Avatar {photo} {online} /> 
    <div class="name">{name}</div>
    <div class="short">{short}</div>
    <RightTop {out} {read}/>
    <RightBottom {time} {pinned} {count} />
</li>