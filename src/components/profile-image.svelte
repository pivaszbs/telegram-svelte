<script>
    import { onMount } from 'svelte';
    import ModalContainer from './modal-container.svelte';
    export let image;
    const   CROPWIDTH = 200,
            CROPHEIGHT = 200,
            cropWidth = 400,
            cropHeight = 400,
            canvas = document.createElement('canvas');

    let 
        cropComponent,
        container,
        crop_img,
        image_target,
        event_state = {},
        ratio = 1.0,
        keyZoomValue = 4.0,
        left = -CROPWIDTH / 2,
        top = -CROPHEIGHT / 2;

    const init = () => {
        left = -(image_target.offsetWidth / 2 - CROPWIDTH / 2);
        top = -(image_target.offsetHeight / 2 - CROPHEIGHT / 2);
    }

    onMount(() => {
        if (image_target.complete) {
            init()
        }
    })

    const imgZoom = (zoom) => {
        if (crop_img.offsetWidth * (ratio + zoom) < cropWidth || crop_img.offsetHeight * (ratio + zoom) < cropWidth)  {
            return;
        }
        ratio = ratio + zoom;
        const ox = -((1-ratio) * crop_img.naturalWidth)/2;
        const oy = -((1-ratio) * crop_img.naturalHeight)/2;
        left = Math.min(left, ox);
        top = Math.min(top,  oy);
        left = Math.max(left, -(crop_img.offsetWidth * ratio - CROPWIDTH) + ox);
        top = Math.max(top, -(crop_img.offsetHeight * ratio - CROPHEIGHT) + oy);
    };

    const startMoving = (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveEventState(e);

        document.addEventListener('mousemove', moving);
        document.addEventListener('touchmove', moving);
        document.addEventListener('mouseup', endMoving);
        document.addEventListener('touchend', endMoving);
    }

    const endMoving = (e) => {
        e.preventDefault();

        document.removeEventListener('mouseup', endMoving);
        document.removeEventListener('touchend', endMoving);
        document.removeEventListener('mousemove', moving);
        document.removeEventListener('touchmove', moving);
    }

    const moving = (e) => {
        const current = {};

        e.preventDefault();
        e.stopPropagation();

        current.x = e.pageX || e.touches && e.touches[0].pageX;
        current.y = e.pageY || e.touches && e.touches[0].pageY;
        if (!current.x || !current.y) {
            return;
        }

        const ox = -((1-ratio) * crop_img.naturalWidth)/2;
        const oy = -((1-ratio) * crop_img.naturalHeight)/2;
        left = Math.min(left + (current.x - event_state.mouse_x), ox);
        top = Math.min(top + (current.y - event_state.mouse_y),  oy);
        left = Math.max(left, -(crop_img.offsetWidth * ratio - CROPWIDTH) + ox);
        top = Math.max(top, -(crop_img.offsetHeight * ratio - CROPHEIGHT) + oy);
        event_state.mouse_x = current.x;
        event_state.mouse_y = current.y;
    }

    const keyHandler = (e) => {
        e.preventDefault();
        const plus = 187;
        const minus = 189;
        switch (e.keyCode) {
            case plus :
                imgZoom(0.05);
                break;
            case minus :
                imgZoom(-0.05);
                break;
        }
    }

    const resizing = (e) => {
        e.preventDefault();
        imgZoom(e.deltaY > 0 ? -0.05: 0.05);
    }

    const saveEventState = (e) => {
        event_state.container_width = container.offsetWidth;
        event_state.container_height = container.offsetHeight;

        event_state.container_left = container.offsetLeft;
        event_state.container_top = container.offsetTop;

        event_state.mouse_x = (e.clientX || e.pageX || e.touches && e.touches[0].clientX) + window.scrollX;
        event_state.mouse_y = (e.clientY || e.pageY || e.touches && e.touches[0].clientY) + window.scrollY;
    }

    const openCropCanvasImg = () => {
        canvas.width = CROPWIDTH;
        canvas.height = CROPHEIGHT;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(crop_img,
                left, top,
                crop_img.width * ratio, crop_img.height * ratio
        );
        const img = canvas.toDataURL('image/png', 1.0);
        console.log('img', img)
    }
</script>

<style lang="scss">

    .container {
        width: 50vw;
        height: 50vh;
        min-width: 500px;
        min-height: 500px;
        background: var(--white);
        display: grid;
        grid-template-rows: 1fr 400px 1fr;
        grid-template-columns: 1fr 400px 1fr;
    }
    .overlay::selection {
        background: transparent;
        border-radius: 50%;
    }
    .crop-component::selection {
        background: transparent;
        border-radius: 50%;
    }
    .crop-blur {
        -webkit-filter: blur(10px) sepia(0.2);
        filter: blur(10px) sepia(0.2);
        position: absolute;
    }
    .crop-image,
    .overlay > img {    
        display: block;
        object-position: center;
    }
    /*add stretch*/
    .crop-image {
        display: block;
        pointer-events: none;
    }
    /*add stretch*/
    .overlay > img {
        position: fixed;
        display: block;
    }
    .crop-component {
        cursor: move;
        position: relative;
        display: flex;
        z-index: 999;
        overflow: hidden;
        width: 400px;
        height: 400px;
        grid-row: 2;
        grid-column: 2;
    }
    .overlay {
        position: relative;
        top: 50%;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
        border-radius: 50%;
            z-index: 999;
        box-shadow: 0 0 0 3px white;
        overflow: hidden;
        width: 200px;
        height: 200px;
    }

</style>

<svelte:body on:keydown={keyHandler} />
<ModalContainer>
    <div class="container">
        <div
            class="crop-component"
            on:mousedown={startMoving}
            on:touchstart={startMoving}
            on:wheel={resizing}>
            <div class="overlay" 
                bind:this={container}>
                <img 
                    bind:this={crop_img}
                    draggable="false" 
                    crossorigin="anonymous"
                    style="top: {top}px; transform: scale({ratio}); left: {left}px"
                    src="{image}"
                    alt=""
                />
            </div>
            <img
                on:load={init}
                bind:this={image_target}
                draggable="false"
                data-is-crop="true"
                src="{image}"
                crossorigin="anonymous"
                style="top: {top + 100}px; transform: scale({ratio}); left: {left + 100}px"

                class="crop-image crop-blur"
                alt=""
            />
        </div>

    </div>
</ModalContainer>