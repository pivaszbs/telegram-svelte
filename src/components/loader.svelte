<style type="text/scss">
.loading {
	display: flex;
	justify-content: center;
	align-items: center;

	&::before {
		content: "";
		display: inline-block;
		width: 50px;
		height: 50px;
		border: 3px solid transparent;
		border-radius: 50%;
		border-bottom-color: var(--primary);
		border-right-color: var(--primary);
		border-top-color: var(--primary);
		animation: spin 1s ease-in-out infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

}
</style>

<div class='loading'></div>
