<script>
	import { name, focused } from '../../../stores/input';

	export let invalid;
	let elem;

	$: $focused === 'name' && elem.focus();

	const onFocus = () => {
		focused.set('name');
	};
</script>

<input
	class:invalid
	bind:this="{elem}"
	on:change
	bind:value="{$name}"
	type="text"
	name="name"
	id="name"
	required
/>
<label>Name</label>

<style>

</style>
