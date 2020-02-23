import { ModeOfOperationCTR } from './aes-ctr';

export default class Abridged {
	protocol = 0xefefefef;
	fromHexString = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

	forbidden = [0x44414548, 0x54534f50, 0x20544547, 0x4954504f, 0xdddddddd, 0xeeeeeeee];

	getRandomBytes(len) {
		const buffer = new Uint8Array(len);
		crypto.getRandomValues(buffer);
		const first_int = new DataView(buffer.buffer.slice(0, 4)).getUint32();
		const second_int = new DataView(buffer.buffer.slice(4, 8)).getUint32();
		if (buffer[0] == 0xef || this.forbidden.includes(first_int) || second_int == 0x00000000) {
			console.log('Regenerating...');
			return this.getRandomBytes(len);
		}
		return buffer;
	}
	async hash256(bytes) {
		return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
	}

	generateObfuscatedInitMessage = async () => {
		// const random = this.getRandomBytes(64);
		const random = new Uint8Array(64);

		random[56] = 239;
		random[57] = 239;
		random[58] = 239;
		random[59] = 239;

		let reversed = random.slice();
		reversed = reversed.reverse();

		this.encryptKey = random.slice(8, 40);
		this.encryptIV = random.slice(40, 56);

		this.decryptKey = random.slice(8, 40);
		this.decryptIV = reversed.slice(40, 56);

		this.encrypt = new ModeOfOperationCTR(this.encryptKey, this.encryptIV);
		this.decrypt = new ModeOfOperationCTR(this.decryptKey, this.decryptIV);

		const encryptedInit = this.obfuscate(random);
		random[56] = encryptedInit[56];
		random[57] = encryptedInit[57];
		random[58] = encryptedInit[58];
		random[59] = encryptedInit[59];
		return random;
	};

	async getEncryptedMessage(input = new Uint8Array()) {
		// return this.fromHexString(
		// 	'ef68a6c7fad8a21db81e5da7d80df21165da02d003792abbde559d9a5924213c8e56dd0e0a69b5ca420190e61205f5cd00b3d4f2aee7530833a275bc0a5c9fcd7a5f3b497d7ce4635ee263e1784301135111e36fb6b9726c26869321c4efdc1ef25e083350c9f57ebe38825f21172c8b2dd8d47bd23c69c276a739a61213f5d272759f3d6ee02fc33eb3f531a3e69b8de9fbe4f519390193fa1e59e885e5b61509492ae05a5e3b494b2165a7f0d2a0bfc004ee15f204da25ec79338fed103efef1438a9dd861335d40'
		// );
		const bytes = new Uint8Array(input.buffer);
		let message, offset;
		const len = bytes.length / 4;
		if (len < 127) {
			message = new Uint8Array(bytes.length + 1);
			message[0] = len;
			offset = 1;
		} else {
			message = new Uint8Array(bytes.length + 4);
			message[0] = 127;
			message[1] = 255 & len;
			message[2] = (len >> 8) & 255;
			message[3] = (len >> 16) & 255;
			offset = 4;
		}

		message.set(bytes, offset);

		const encrypted_message = this.obfuscate(message);
		return encrypted_message;
		// return message;
	}

	obfuscate(data) {
		return this.encrypt.encrypt(data);
	}

	deobfuscate(data) {
		return this.decrypt.decrypt(data);
	}
}
