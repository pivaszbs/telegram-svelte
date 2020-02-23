import Abridged from './transports';
import { noop } from '../Helper';

export default class WebSocketManager {
	mtpTransport = new Abridged();
	inited = false;

	constructor(url = '', handler = noop) {
		this.socket = new WebSocket(url.replace('http', 'wss'), 'binary');
		this.socket.binaryType = 'arraybuffer';
		this.socket.onopen = this.onWebsocketOpen;
		this.socket.onmessage = async data => {
			let deobfuscated = this.mtpTransport.deobfuscate(new Uint8Array(data.data));
			deobfuscated = deobfuscated[0] == 127 ? deobfuscated.slice(4) : deobfuscated.slice(1);
			handler(deobfuscated);
		};
		this.socket.onclose = event => {
			console.log('Socket is close because of ', event);
		};
		this.socket.onerror = event => {
			console.log('Socket error', event);
		};
		this.handler = handler;
	}

	onWebsocketOpen = async data => {
		const initMessage = (await this.mtpTransport.generateObfuscatedInitMessage()) || new Uint8Array(64);

		this.socket.send(initMessage);
		this.inited = true;
	};

	async sendData(data) {
		if (!this.inited) {
			setTimeout(() => {
				this.sendData(data);
			}, 500);
			return;
		}
		if (!this.isOpen()) {
			return;
		}
		const obfuscated = await this.mtpTransport.getEncryptedMessage(data);
		this.socket.send(obfuscated);
	}

	isOpen() {
		return this.socket.readyState === this.socket.OPEN;
	}
}
