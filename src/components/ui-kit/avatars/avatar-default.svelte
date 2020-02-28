<script>
    export let title;
	export let big;
	export let small;
	export let medium;
</script>

<div class="avatar" class:small={small} class:medium={medium} class:big={big}>
    {title[0]}
</div>