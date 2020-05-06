<script>
	let avatar; //from store
	let name;
	let phone;
</script>

<div class="sidebar__info info">
	<div class="info__avatar">
		<img src="" class="avatar avatar_big info__avatar_img" />
	</div>
	<div class="info__name"></div>
	<div class="info__phone"></div>
</div>

<style lang="scss">
	.sidebar {
		&__info {
			grid-row: 2;
			grid-column: 1/4;
			display: flex;
			flex-direction: column;
			align-items: center;
		}
	}
</style>
