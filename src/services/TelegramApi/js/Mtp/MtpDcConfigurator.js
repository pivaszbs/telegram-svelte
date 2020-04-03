import { Config } from '../lib/config';

export default function MtpDcConfiguratorModule() {
	window.chosenServers = {};

	const chooseServer = (dcID, upload) => {
		const dcOptions = Config.Server.Production;

		if (chosenServers[dcID] === undefined) {
			let chosenServer = false,
				i,
				dcOption;

			for (i = 0; i < dcOptions.length; i++) {
				dcOption = dcOptions[i];
				if (dcOption.id == dcID) {
					chosenServer =
						chooseProtocol() +
						'//' +
						dcOption.host +
						(dcOption.port != 80 ? ':' + dcOption.port : '') +
						'/apiws1' +
						(Config.Modes.test ? '_test' : '');
					break;
				}
			}
			chosenServers[dcID] = chosenServer;
		}

		return chosenServers[dcID];
	};

	const chooseProtocol = () => {
		if (location.protocol.indexOf('http') != -1) {
			return location.protocol;
		}

		return 'https:';
	};

	return {
		chooseServer,
		chooseProtocol,
	};
}
