<script>
	import Menu from './../components/menu/menu.svelte';
    import UserDialogs from '../components/user-dialogs.svelte';
    
</script>

<style>
    .left {
        width: 25vw;
    }

    .right {
        width: 75vw;
    }
</style>

<div class="chat-page">
    <div class="left">
        <Menu />
        <UserDialogs />
    </div>
    <div class="right">
        
    </div>
</div>