<script>
	import { onMount } from 'svelte';
	import ModalContainer from './modal-container.svelte';
	import close from 'Source/icons/close.svg';
	export let image;
	export let cropped;
	export let url;
	let destroy = () => {
		cropped = true;
	}; // function to destroy component, binded to modal container

	const CROPWIDTH = 200,
		CROPHEIGHT = 200,
		cropWidth = 400,
		cropHeight = 400,
		canvas = document.createElement('canvas');

	let cropComponent,
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
	};

	onMount(() => {
		if (image_target.complete) {
			init();
		}
	});

	const imgZoom = zoom => {
		if (
			crop_img.offsetWidth * (ratio + zoom) < cropWidth ||
			crop_img.offsetHeight * (ratio + zoom) < cropWidth
		) {
			return;
		}
		ratio = ratio + zoom;
		const ox = -((1 - ratio) * crop_img.naturalWidth) / 2;
		const oy = -((1 - ratio) * crop_img.naturalHeight) / 2;
		left = Math.min(left, ox);
		top = Math.min(top, oy);
		left = Math.max(left, -(crop_img.offsetWidth * ratio - CROPWIDTH) + ox);
		top = Math.max(top, -(crop_img.offsetHeight * ratio - CROPHEIGHT) + oy);
	};

	const startMoving = e => {
		e.preventDefault();
		e.stopPropagation();
		saveEventState(e);

		document.addEventListener('mousemove', moving);
		document.addEventListener('touchmove', moving);
		document.addEventListener('mouseup', endMoving);
		document.addEventListener('touchend', endMoving);
	};

	const endMoving = e => {
		e.preventDefault();

		document.removeEventListener('mouseup', endMoving);
		document.removeEventListener('touchend', endMoving);
		document.removeEventListener('mousemove', moving);
		document.removeEventListener('touchmove', moving);
	};

	const moving = e => {
		const current = {};

		e.preventDefault();
		e.stopPropagation();

		current.x = e.pageX || (e.touches && e.touches[0].pageX);
		current.y = e.pageY || (e.touches && e.touches[0].pageY);
		if (!current.x || !current.y) {
			return;
		}

		const ox = -((1 - ratio) * crop_img.naturalWidth) / 2;
		const oy = -((1 - ratio) * crop_img.naturalHeight) / 2;
		left = Math.min(left + (current.x - event_state.mouse_x), ox);
		top = Math.min(top + (current.y - event_state.mouse_y), oy);
		left = Math.max(left, -(crop_img.offsetWidth * ratio - CROPWIDTH) + ox);
		top = Math.max(top, -(crop_img.offsetHeight * ratio - CROPHEIGHT) + oy);
		event_state.mouse_x = current.x;
		event_state.mouse_y = current.y;
	};

	const keyHandler = e => {
		e.preventDefault();
		const plus = 187;
		const minus = 189;
		const enter = 13;
		switch (e.keyCode) {
			case plus:
				imgZoom(0.05);
				break;
			case minus:
				imgZoom(-0.05);
				break;
			case enter:
				openCropCanvasImg();
				break;
		}
	};

	const resizing = e => {
		e.preventDefault();
		imgZoom(e.deltaY > 0 ? -0.05 : 0.05);
	};

	const saveEventState = e => {
		event_state.container_width = container.offsetWidth;
		event_state.container_height = container.offsetHeight;

		event_state.container_left = container.offsetLeft;
		event_state.container_top = container.offsetTop;

		event_state.mouse_x =
			(e.clientX || e.pageX || (e.touches && e.touches[0].clientX)) +
			window.scrollX;
		event_state.mouse_y =
			(e.clientY || e.pageY || (e.touches && e.touches[0].clientY)) +
			window.scrollY;
	};

	const openCropCanvasImg = () => {
		canvas.width = CROPWIDTH;
		canvas.height = CROPHEIGHT;
		const ox = -((1 - ratio) * crop_img.naturalWidth) / 2;
		const oy = -((1 - ratio) * crop_img.naturalHeight) / 2;

		const ctx = canvas.getContext('2d');
		ctx.drawImage(
			crop_img,
			left - ox,
			top - oy,
			crop_img.naturalWidth * ratio,
			crop_img.naturalHeight * ratio
		);

		canvas.toBlob(img => {
			url = window.URL.createObjectURL(img);
		});
		cropped = true;
	};

	const onClose = () => {
		destroy();
	};
</script>

<svelte:body on:keydown="{keyHandler}" />
<ModalContainer {destroy}>
	<div class="container">
		<div class="icon close" on:click="{onClose}">
			<img src="{close}" alt="close" />
		</div>
		<h2>Drag to reposition</h2>
		<div
			class="crop-component"
			on:mousedown="{startMoving}"
			on:touchstart="{startMoving}"
			on:wheel="{resizing}"
		>
			<div class="overlay" bind:this="{container}">
				<img
					bind:this="{crop_img}"
					draggable="false"
					crossorigin="anonymous"
					style="top: {top}px; transform: scale({ratio}); left: {left}px"
					src="{image}"
					alt=""
				/>
			</div>
			<img
				on:load="{init}"
				bind:this="{image_target}"
				draggable="false"
				data-is-crop="true"
				src="{image}"
				crossorigin="anonymous"
				style="top: {top + 100}px; transform: scale({ratio}); left: {left + 100}px"
				class="crop-image crop-blur"
				alt=""
			/>
		</div>
		<div on:click="{openCropCanvasImg}" class="crop">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
				<path
					d="M4.70710678,12.2928932 C4.31658249,11.9023689
					3.68341751,11.9023689 3.29289322,12.2928932
					C2.90236893,12.6834175 2.90236893,13.3165825
					3.29289322,13.7071068 L8.29289322,18.7071068
					C8.68341751,19.0976311 9.31658249,19.0976311
					9.70710678,18.7071068 L20.7071068,7.70710678
					C21.0976311,7.31658249 21.0976311,6.68341751
					20.7071068,6.29289322 C20.3165825,5.90236893
					19.6834175,5.90236893 19.2928932,6.29289322 L9,16.5857864
					L4.70710678,12.2928932 Z"
				></path>
			</svg>
		</div>
	</div>
</ModalContainer>

<style lang="scss">
	.container {
		min-width: 500px;
		min-height: 500px;
		background: var(--white);
		display: grid;
		grid-template-rows: 1fr 400px 1fr;
		grid-template-columns: 1fr 400px 1fr;
		place-items: center;
		border-radius: 8px;
	}

	h2 {
		justify-self: start;
		font-size: 20px;
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
		border-radius: 8px;
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

	.close {
		grid-row: 1;
		grid-column: 1;
	}

	.crop {
		grid-row: 3;
		grid-column: 3;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: var(--primary);
		margin-bottom: 16px;
		margin-right: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		svg {
			fill: var(--white);
		}
	}
</style>
