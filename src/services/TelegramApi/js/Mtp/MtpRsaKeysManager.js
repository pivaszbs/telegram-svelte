import { TLSerialization } from "../lib/tl_utils";
import { sha1BytesSync, bytesToHex, bytesFromHex, bigStringInt } from "../lib/bin_utils";
import { extend } from "../Etc/Helper";

export default class MtpRsaKeysManagerModule {
    publisKeysHex = [{
        modulus: 'c150023e2f70db7985ded064759cfecf0af328e69a41daf4d6f01b538135a6f91f8f8b2a0ec9ba9720ce352efcf6c5680ffc424bd634864902de0b4bd6d49f4e580230e3ae97d95c8b19442b3c0a10d8f5633fecedd6926a7f6dab0ddb7d457f9ea81b8465fcd6fffeed114011df91c059caedaf97625f6c96ecc74725556934ef781d866b34f011fce4d835a090196e9a5f0e4449af7eb697ddb9076494ca5f81104a305b6dd27665722c46b60e5df680fb16b210607ef217652e60236c255f6a28315f4083a96791d7214bf64c1df4fd0db1944fb26a2a57031b32eee64ad15a8ba68885cde74a5bfc920f6abf59ba5c75506373e7130f9042da922179251f',
        exponent: '010001'
    }];

    publicKeysParsed = {};
    prepared = false;

    prepareRsaKeys = () => {
        if (this.prepared) {
            return;
        }

        for (let i = 0; i < this.publisKeysHex.length; i++) {
            const keyParsed = this.publisKeysHex[i];

            const RSAPublicKey = new TLSerialization();
            RSAPublicKey.storeBytes(bytesFromHex(keyParsed.modulus), 'n');
            RSAPublicKey.storeBytes(bytesFromHex(keyParsed.exponent), 'e');

            const buffer = RSAPublicKey.getBuffer();

            const fingerprintBytes = sha1BytesSync(buffer).slice(-8);
            fingerprintBytes.reverse();

            this.publicKeysParsed[bytesToHex(fingerprintBytes)] = {
                modulus: keyParsed.modulus,
                exponent: keyParsed.exponent
            };
        }

        this.prepared = true;
    }

    selectRsaKeyByFingerPrint = (fingerprints) => {
        this.prepareRsaKeys();

        let fingerprintHex, foundKey, i;
        for (i = 0; i < fingerprints.length; i++) {
            fingerprintHex = bigStringInt(fingerprints[i]).toString(16);
            foundKey = this.publicKeysParsed[fingerprintHex];
            if (foundKey) {
                return extend({ fingerprint: fingerprints[i] }, foundKey);
            }
        }

        return false;
    }

    //legacy
    prepare = this.prepareRsaKeys;
    select = this.selectRsaKeyByFingerPrint;
}
