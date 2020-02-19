<script>
	export let type;
	export let variant;
</script>

<style type="text/scss">
button {
  width: 360px;
  height: 54px;

  cursor: pointer;
  position: relative;

  border: 0;
  border-radius: 10px;

  font-size: 20px;
  font-weight: 500;
  outline: none;

  transition: background-color 300ms;
}
.primary {
  color: var(--white);
  background: var(--primary);
  -webkit-tap-highlight-color: var(--black);
}
</style>

<button {type} on:click class:primary={variant === 'primary'}>
	<slot>Button</slot>
</button>