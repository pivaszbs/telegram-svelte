<script>
	import Saved from 'inline/saved.svg';
	export let big;
	export let small;
	export let medium;
</script>

<div class="avatar" class:small class:medium class:big>
	{@html Saved}
</div>

<style>
	div {
		background-color: var(--primary);
	}

	.small svg {
		width: 24px;
		height: 24px;
	}

	.medium svg {
		width: 32px;
		height: 32px;
	}

	.big svg {
		width: 48px;
		height: 48px;
	}
</style>
