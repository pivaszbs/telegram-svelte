<script>
  import { fly } from 'svelte/transition';

	export let type;
  export let variant;
  export let loading;
</script>

<style type="text/scss">
  button {
    width: 360px;
    height: 54px;

    cursor: pointer;
    position: relative;

    border: 0;
    border-radius: 10px;

    font-size: 16px;
    font-weight: 500;
    outline: none;

    transition: background-color 300ms;
  }

  .primary {
    color: var(--white);
    background: var(--primary);
    -webkit-tap-highlight-color: var(--black);
  }

  .loading span {
    display: flex;
    justify-content: center;
    align-items: center;
    &::after {
      content: "";
      display: inline-block;
      width: 25px;
      height: 25px;
      border: 2px solid transparent;
      border-radius: 50%;
      position: absolute;
      right: 16px;
      border-bottom-color: var(--white);
      border-right-color: var(--white);
      border-top-color: var(--white);
      animation: spin 1s ease-in-out infinite;
    }
  }

  .hide {
    opacity: 0;
    z-index: -1;
  }

</style>

<button transition:fly={{ duration: 200, y: 100}} class:loading={loading} {type} on:click class:primary={variant === 'primary'}>
	<span>
    <slot>Button</slot>
  </span>
  
</button>