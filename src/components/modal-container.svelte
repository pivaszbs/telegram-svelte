<style>
    .modal-container {
        position: absolute;
        height: 100vh;
        width: 100vw;
        background: transparent;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .paranja {
        position: absolute;
        z-index: -1;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
    }
</style>

<div class="modal-container">
    <div class="paranja"></div>
    <slot></slot>
</div>