<script>
	import Ripple from '@smui/ripple';
    import { clsx } from './../../helpers/index.js';
    import './popup-item.scss';

    let className;
    export { className as class }  
</script>

<li use:Ripple={{ ripple: true, color: 'secondary' }} class={clsx('popup-item', className)}>
    <slot name="img"></slot>
    <slot name="text"></slot>
</li>