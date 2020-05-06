<script>
	export let label;
	export let name;
	export let checked = false;
</script>

<input {checked} on:change type="checkbox" id="{name}" {name} />
{#if label}
	<label for="{name}">{label}</label>
{/if}

<style lang="scss">
	input {
		width: 24px;
		height: 24px;
		-webkit-appearance: none;
		display: inline-flex;
		align-items: flex-start;
		margin-top: var(--indent-x-small);
		background: var(--white) url('~images/empty.svg');

		&:active,
		&:checked:active,
		&:focus {
			outline: none;
		}

		&:checked {
			background: url('~images/filled.svg');
		}
	}

	label {
		display: inline-block;
		margin-left: var(--indent-xxx-large);
		user-select: none;
		font-size: inherit;
	}
</style>
