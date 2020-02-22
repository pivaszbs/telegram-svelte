<script>
    export let image;
    import { onMount } from 'svelte';

    let cropComponent,
        container,
        crop_img,
        image_target,
        event_state = {},
        ratio = 1.0,
        keyZoomValue = 4.0,
        MINWIDTH = 50,
        MINHEIGHT = 50,
        CROPWIDTH = 160,
        CROPHEIGHT = 160,
        cropLeft = 0,
        cropTop = 0,
        cropWidth = 0,
        cropHeight = 0,
        resize_canvas = null;

    onMount(() => {
        const left = image_target.offsetWidth / 2 - CROPWIDTH / 2;
        const top = image_target.offsetHeight / 2 - CROPHEIGHT / 2;
        updateCropImage(left, top);
    })

    const imgZoom = (zoom) => {
            zoom = zoom * Math.PI * 2
            var newWidth = Math.floor(container.clientWidth + zoom)
                    , newHeight = Math.floor(container.clientHeight + zoom)
                    , w = crop_img.clientWidth
                    , h = crop_img.clientHeight
                    , left
                    , top
                    , right
                    , bottom;

            if (newWidth < MINWIDTH) {
                return;
            } else if (newWidth > w) {
                return;
            }

            left = container.offsetLeft - (zoom / 2);
            top = container.offsetTop - (zoom / 2);
            right = left + newWidth;
            bottom = top + newHeight;

            if (left < 0) {
                left = 0;
            }
            if (top < 0) {
                top = 0;
            }
            if (right > w) {
                return;
            }
            if (bottom > h) {
                return;
            }

            ratio = CROPWIDTH / newWidth;

            updateCropSize(newWidth, newWidth);
            updateCropImage(left, top);
            updateContainer(left, top);
            crop();
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
        let curuntTouch = {}
                , left
                , top
                , w
                , h;

        e.preventDefault();
        e.stopPropagation();

        curuntTouch.x = e.pageX || e.touches && e.touches[0].pageX;
        curuntTouch.y = e.pageY || e.touches && e.touches[0].pageY;

        left = curuntTouch.x - (event_state.mouse_x - event_state.container_left);
        top = curuntTouch.y - (event_state.mouse_y - event_state.container_top);
        w = container.offsetWidth;
        h = container.offsetHeight;

        if (left < 0) {
            left = 0;
        } else if (left > crop_img.offsetWidth - w) {
            left = crop_img.offsetWidth - w;
        }
        if (top < 0) {
            top = 0;
        } else if (top > crop_img.offsetHeight - h) {
            top = crop_img.offsetHeight - h;
        }

        updateCropImage(left, top);
        updateContainer(left, top);
    }

    const keyHandler = (e) => {
        e.preventDefault();

        switch (String.fromCharCode(e.charCode)) {
            case '+' :
                imgZoom(keyZoomValue);
                break;
            case '-' :
                imgZoom(-keyZoomValue);
                break;
        }
    }

    const resizing = (e) => {
        e.preventDefault();
        imgZoom(e.deltaY > 0 ? 1 : -1);
    }

    const updateCropSize = (width, height)  => {
        container.style.width = width + 'px';
        container.style.height = height + 'px';
    }

    const updateCropImage = (left, top)  => {
        cropLeft = -left * ratio;
        cropTop = -top * ratio;
        left = -left + 'px';
        top = -top + 'px';

        crop_img.style.top = top;
        crop_img.style.left = left;
    }

    const updateContainer = (left, top) => {
        top = top + (CROPWIDTH / 2) + 'px';
        left = left + (CROPHEIGHT / 2) + 'px';

        container.style.top = top;
        container.style.left = left;
    }

    const saveEventState = (e) => {
        event_state.container_width = container.offsetWidth;
        event_state.container_height = container.offsetHeight;

        event_state.container_left = container.offsetLeft;
        event_state.container_top = container.offsetTop;

        event_state.mouse_x = (e.clientX || e.pageX || e.touches && e.touches[0].clientX) + window.scrollX;
        event_state.mouse_y = (e.clientY || e.pageY || e.touches && e.touches[0].clientY) + window.scrollY;
    }

    const crop = () => {
        cropWidth = crop_img.width * ratio;
        cropHeight = crop_img.height * ratio;

        resize_canvas.width = CROPWIDTH;
        resize_canvas.height = CROPHEIGHT;

        var ctx = resize_canvas.getContext('2d');
        ctx.drawImage(crop_img,
                cropLeft, cropTop,
                cropWidth, cropHeight
        );
    }

    const openCropCanvasImg = () => {
        crop();
        const img = resize_canvas.toDataURL('image/png', 1.0);
    }
</script>

<style>
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
    }
    .crop-image,
    .overlay > img {
        width: auto;
        height: auto;
        /* можно явно указать либо ширину, либо высоту */
        width: 500px;
        /*либо height: 300px;*/
        display: block;
        object-fit: contain;
        object-position: center;
    }
    /*add stretch*/
    .crop-image {
        display: block;
        position: relative;
        pointer-events: none;
    }
    /*add stretch*/
    .overlay > img {
        position: absolute;
        display: block;
    }
    .crop-component {
        position: relative;
        display: table;
        z-index: 999;
        background-color: white;
        margin: 0 auto;
        overflow: hidden;
        border: white 3px solid;
    }
    .overlay {
        position: absolute;
        left: 50%;
        top: 50%;  
        border-radius: 50%;
            z-index: 999;
        margin-left: -100px;
        margin-top: -100px;
        width: 200px;
        height: 200px;
        box-shadow: 0 0 0 3px white;
        overflow: hidden;
        box-sizing: content-box;
    }
    .overlay:hover,
    .overlay:active {
        cursor: move;
    }
    .btn-crop {
        position: fixed;
        right: 5px;
        bottom: 5px;
        vertical-align: bottom;
        padding: 6px 10px;
        z-index: 999;
        background-color: #DE3C50;
        border: none;
        border-radius: 5px;
        color: #FFF;
    }
</style>

<svelte:body on:keydown={keyHandler} />
<div on:mousedown={startMoving} on:touchstart={startMoving} on:wheel={resizing}>
    <div class="overlay" bind:this={container}>
        <canvas bind:this={resize_canvas}></canvas>
        <img 
            bind:this={crop_img}
            draggable="false" 
            crossorigin="Anonymous"
            src="{image}"
            alt=""
        />
    </div>
    <img
        bind:this={image_target}
        draggable="false"
        data-is-crop="true"
        crossorigin="Anonymous"
        src="{image}"
        class="crop-image crop-blur"
        alt=""
    />
</div>