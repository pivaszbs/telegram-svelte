import $timeout from './angular/$timeout';
import { sha1HashSync, sha256HashSync, convertToArrayBuffer, aesEncryptSync, aesDecryptSync, convertToByteArray, pqPrimeFactorization, bytesModPow } from '../lib/bin_utils';

export default class CryptoWorkerModule {
    sha1Hash(bytes) {
        return $timeout(function () {
            return sha1HashSync(bytes);
        });
    }
    sha256Hash(bytes) {
        return $timeout(function () {
            return sha256HashSync(bytes);
        });
    }
    aesEncrypt(bytes, keyBytes, ivBytes) {
        return $timeout(function () {
            return convertToArrayBuffer(aesEncryptSync(bytes, keyBytes, ivBytes));
        });
    }
    aesDecrypt(encryptedBytes, keyBytes, ivBytes) {
        return $timeout(function () {
            return convertToArrayBuffer(aesDecryptSync(encryptedBytes, keyBytes, ivBytes));
        });
    }
    factorize(bytes) {
        bytes = convertToByteArray(bytes);

        return $timeout(function () {
            return pqPrimeFactorization(bytes);
        });
    }
    modPow(x, y, m) {
        return $timeout(function () {
            return bytesModPow(x, y, m);
        });
    }
}