<script>
    let headerButton;
    let headerText = 'Settings';
    let more = false;
</script>

<div class="sidebar__header header">
<div class="header__back icon"><img src="./icons/back.svg" alt=""></div>
<div class="header__title">{headerText}</div>
<div on:click={() => more = !more} class="header__more icon"><img src="./icons/more.svg" alt="More">

    {#if more}
	<ul class="more-list popup popup_hidden">
		<li class="more-list__logout popup-item">
			<img src="./icons/logout.svg" class="logout__img">
			<div class="more-list__text">Log Out</div>
		</li>
	</ul>
    {/if}
</div>
</div>

<style lang="scss">

    .header {
        grid-column: 1/4;


        display: grid;
        grid-template-columns: 60px auto 60px;

        &__title {
            align-self: center;
            font-style: 20px;
            font-weight: 600;
        }
    }

</style>
