<script>
	import { password, focused } from '../../../stores/input';

	let elem;

	$: $focused === 'password' && elem.focus();

	const onFocus = () => {
		focused.set('password');
	};
</script>

<input
	bind:this="{elem}"
	on:change
	bind:value="{$password}"
	type="text"
	name="password"
	id="password"
	required
/>
<label>Password</label>
