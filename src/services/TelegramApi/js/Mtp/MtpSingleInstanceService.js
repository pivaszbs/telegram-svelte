import { nextRandomInt } from '../lib/bin_utils';
import IdleManagerModule from '../Etc/IdleManager';
import StorageModule from '../Etc/Storage';
import { dT, tsNow } from '../lib/utils';
import $rootScope from '../Etc/angular/$rootScope';
import MtpNetworkerFactoryModule from './MtpNetworkerFactory';
import $timeout from '../Etc/angular/$timeout';
import { Config } from '../lib/config';

export default function MtpSingleInstanceServiceModule() {
	window.instanceID = nextRandomInt(0xffffffff);
	window.started = false;
	window.masterInstance = false;
	window.deactivatePromise = false;
	window.deactivated = false;

	let IdleManager = new IdleManagerModule();
	let Storage = StorageModule();
	let MtpNetworkerFactory = MtpNetworkerFactoryModule();

	const start = () => {
		if (!started && !Config.Navigator.mobile) {
			started = true;

			IdleManager.start();

			// $interval(checkInstance, 5000);
			// setInterval(checkInstance, 5000);
			// checkInstance();

			try {
				// $(window).on('beforeunload', clearInstance);
				window.addEventListener('beforeunload', clearInstance);
			} catch (e) {
				Config.Modes.debug && console.log('Error starting instance: ', e);
			}
		}
	};

	const clearInstance = () => {
		Storage.methods.remove(masterInstance ? 'xt_instance' : 'xt_idle_instance');
	};

	const deactivateInstance = () => {
		if (masterInstance || deactivated) {
			return false;
		}
		Config.Modes.debug && console.log(dT(), 'deactivate');
		deactivatePromise = false;
		deactivated = true;
		clearInstance();

		$rootScope.idle.deactivated = true;
	};

	const checkInstance = () => {
		if (deactivated) {
			return false;
		}

		const time = tsNow();
		const idle = $rootScope.idle && $rootScope.idle.isIDLE;
		const newInstance = { id: instanceID, idle: idle, time: time };

		Storage.methods.get('xt_instance', 'xt_idle_instance').then(result => {
			const curInstance = result[0],
				idleInstance = result[1];

			// console.log(dT(), 'check instance', newInstance, curInstance, idleInstance);
			if (!idle || !curInstance || curInstance.id == instanceID || curInstance.time < time - 60000) {
				if (idleInstance && idleInstance.id == instanceID) {
					Storage.methods.remove('xt_idle_instance');
				}
				Storage.methods.set({ xt_instance: newInstance });
				if (!masterInstance) {
					MtpNetworkerFactory.startAll();
					console.warn(dT(), 'now master instance', newInstance);
				}
				masterInstance = true;
				if (deactivatePromise) {
					$timeout.cancel(deactivatePromise);
					deactivatePromise = false;
				}
			} else {
				Storage.methods.set({ xt_idle_instance: newInstance });
				if (masterInstance) {
					MtpNetworkerFactory.stopAll();
					console.warn(dT(), 'now idle instance', newInstance);
					if (!deactivatePromise) {
						deactivatePromise = $timeout(deactivateInstance, 30000);
					}
				}
				masterInstance = false;
			}
		});
	};

	return {
		start,
		clearInstance,
		deactivateInstance,
		checkInstance,
	};
}
