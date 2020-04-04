<script>
	import { lastName, focused } from '../../../stores/input';
</script>

<input
	required
	on:change
	bind:value="{$lastName}"
	type="text"
	lastName="lastName"
	id="lastName"
/>
<label>Last Name(optional)</label>
