<div class="loading"></div>

<style type="text/scss">
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;

		&::before {
			content: '';
			display: inline-block;
			width: 50px;
			height: 50px;
			border-radius: 50%;
			border: 3px solid var(--primary);
			border-left-color: transparent;
			animation: spin 1s ease-in-out infinite;
		}
	}
</style>
