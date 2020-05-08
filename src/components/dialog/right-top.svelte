<script>
	import Read from 'inline/read.svg';
	import NotRead from 'inline/notRead.svg';

	export let time;
	export let out;
	export let read;
</script>

<div class="right-top">
	{#if out}
		<div class="out">
			{#if read}
				{@html Read}
			{:else}
				{@html NotRead}
			{/if}
		</div>
	{/if}
	<div class:full="{!out}" class="time">{time}</div>
</div>

<style>
	.right-top {
		grid-row: 1;
		grid-column: 3;
		gap: 4px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		justify-self: flex-end;
	}

	.time {
		color: var(--secondary);
		font-size: var(--font-size-small);
		align-self: center;
	}

	.full {
		grid-column: 1/3;
	}

	.out {
		fill: var(--green);
		align-self: flex-start;
		justify-self: flex-end;
	}
</style>
