<script>
    import Button from '../components/button.svelte';
    import InputName from '../components/ui-kit/inputs/input-name.svelte';
    import InputLastName from '../components/ui-kit/inputs/input-last-name.svelte';
    import ProfileImage from '../components/profile-image.svelte';
    import { name, lastName } from '../stores/input';
    import { router } from '../stores/router';

    let url;
    let loading;
    let nameInvalid = false;

    const onFileChange = e => {
        const file = e.srcElement.files[0];
        if (file) {
            url = window.URL.createObjectURL(new Blob([file]));
        }
    };

    const onDrop = e => {
        const file = e.dataTransfer.files[0];
        if (file) {
            url = window.URL.createObjectURL(new Blob([file]));
        }
    }

    const onSubmit = e => {
        e.preventDefault();
        if ($name.length > 0) {
            loading = true;
            router.setRoute('chat-page');
        } else {
            nameInvalid = true;
        }
    }

    name.subscribe(() => {
        nameInvalid = false;
    })

    lastName.subscribe(() => {
        nameInvalid = false;
    })

</script>

<style lang="scss">
    form {
        display: flex;
        align-items: center;
        flex-direction: column;
        margin-top: 10vh;
        width: 400px;
        text-align: center;
    
        .icon {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;

            width: 160px;
            height: 160px;

            background-color: var(--primary);

            border-radius: 50%;

            & .icon_display {
                background: url('../icons/add_photo.svg');
                background-size: cover;
                width: 50px;
                height: 50px;
                position: absolute
            }
        }
    }

    .hint {
		color: var(--dark-gray);
		font-weight: 400;
		font-size: 16px;
		width: 50%;
		margin-bottom: 4vh;
    }
    
    .input-group {
        margin-bottom: 24px;
    }

    .hide {
        display: none;
    }

    input {
        opacity: 0.01;
        width: 160px;
        height: 160px;
        border-radius: 50%;
        cursor: pointer;
    }

    img {
        width: 160px;
        height: 160px;
        border-radius: 50%;
        position: absolute;
    }
</style>

{#if url}
    <ProfileImage image={url} />
{/if}
<form on:submit={onSubmit} >
	<div on:drop={onDrop} class="icon">
        <img class:hide={!url} src="{url}" alt="photo">
		<div class:hide={url} class="icon_display"></div>
		<input on:change={onFileChange} type="file" />
	</div>
	<h1>Your Name</h1>
	<div class="hint">Enter your name and add a profile picture</div>
	<div class="input-group">
		<InputName invalid={nameInvalid} />
	</div>
	<div class="input-group">
		<InputLastName />
	</div>
    <Button on:click={onSubmit} type="submit" variant="primary" {loading}>START MESSAGING</Button>
</form>