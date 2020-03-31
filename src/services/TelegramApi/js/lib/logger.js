import { dT } from './utils';
import { Config } from './config';

export default function(...info) {
	Config.Modes.debug && console.log(dT(), ...info);
}
