import MtpApiManagerModule from './MtpApiManager';
import { Config } from '../lib/config';
import { nextRandomInt } from '../lib/bin_utils';
import { dT } from '../lib/utils';
import { noop, isFunction } from '../Etc/Helper';

export default function MtpApiFileManagerModule() {
	let cachedFs = false;
	let cachedFsPromise = false;
	let cachedSavePromises = {};
	let cachedDownloadPromises = {};
	let cachedDownloads = {};

	let downloadPulls = {};
	let downloadActives = {};

	let MtpApiManager = window.apiManager || new MtpApiManagerModule();

	const downloadRequest = (dcID, cb, activeDelta) => {
		if (downloadPulls[dcID] === undefined) {
			downloadPulls[dcID] = [];
			downloadActives[dcID] = 0;
		}

		const downloadPull = downloadPulls[dcID];
		return new Promise((resolve, reject) => {
			downloadPull.push({ cb: cb, resolve: resolve, reject: reject, activeDelta: activeDelta });
			setZeroTimeout(() => {
				downloadCheck(dcID);
			});
		});
	};

	const downloadCheck = dcID => {
		const downloadPull = downloadPulls[dcID];
		const downloadLimit = dcID == 'upload' ? 11 : 5;

		if (downloadActives[dcID] >= downloadLimit || !downloadPull || !downloadPull.length) {
			return false;
		}

		const data = downloadPull.shift(),
			activeDelta = data.activeDelta || 1;

		downloadActives[dcID] += activeDelta;

		// const a = index++;
		data.cb().then(
			result => {
				downloadActives[dcID] -= activeDelta;
				downloadCheck(dcID);

				data.resolve(result);
			},
			error => {
				downloadActives[dcID] -= activeDelta;
				downloadCheck(dcID);

				data.reject(error);
			}
		);
	};

	const uploadFile = (file, progress) => {
		let fileSize = file.size,
			isBigFile = fileSize >= 10485760,
			canceled = false,
			resolved = false,
			doneParts = 0,
			partSize = 262144, // 256 Kb
			activeDelta = 2;

		if (!fileSize) {
			return Promise.reject({ type: 'EMPTY_FILE' });
		}

		if (!isFunction(progress)) {
			progress = noop;
		}

		if (fileSize > 67108864) {
			partSize = 524288;
			activeDelta = 4;
		} else if (fileSize < 102400) {
			partSize = 32768;
			activeDelta = 1;
		}

		const totalParts = Math.ceil(fileSize / partSize);

		if (totalParts > 3000) {
			return Promise.reject({ type: 'FILE_TOO_BIG' });
		}

		return new Promise((resolve, reject) => {
			let fileID = [nextRandomInt(0xffffffff), nextRandomInt(0xffffffff)],
				errorHandler = function(error) {
					// console.error('Up Error', error);
					reject(error);
					canceled = true;
					errorHandler = noop;
				},
				part = 0,
				offset,
				resultInputFile = {
					_: isBigFile ? 'inputFileBig' : 'inputFile',
					id: fileID,
					parts: totalParts,
					name: file.name,
					md5_checksum: '',
				};

			for (offset = 0; offset < fileSize; offset += partSize) {
				((offset, part) => {
					downloadRequest(
						'upload',
						() => {
							return new Promise((uploadResolve, uploadReject) => {
								// var uploadDeferred = new Promise();

								const reader = new FileReader();
								const blob = file.slice(offset, offset + partSize);

								reader.onloadend = e => {
									if (canceled) {
										uploadReject();
										return;
									}
									if (e.target.readyState != FileReader.DONE) {
										return;
									}
									MtpApiManager.invokeApi(
										isBigFile ? 'upload.saveBigFilePart' : 'upload.saveFilePart',
										{
											file_id: fileID,
											file_part: part,
											file_total_parts: totalParts,
											bytes: e.target.result,
										},
										{
											startMaxLength: partSize + 256,
											fileUpload: true,
											singleInRequest: true,
										}
									).then(result => {
										doneParts++;
										uploadResolve();
										if (doneParts >= totalParts) {
											resolve(resultInputFile);
											resolved = true;
										} else {
											Config.Modes.debug &&
												console.log(dT(), 'Progress', (doneParts * partSize) / fileSize);
											progress(offset < fileSize ? offset : fileSize, fileSize);
											// resolve({ done: doneParts * partSize, total: fileSize });
										}
									}, errorHandler);
								};

								reader.readAsArrayBuffer(blob);
							});
						},
						activeDelta
					);
				})(offset, part++);
			}

			const cancel = () => {
				Config.Modes.debug && console.log('cancel upload', canceled, resolved);
				if (!canceled && !resolved) {
					canceled = true;
					errorHandler({ type: 'UPLOAD_CANCELED' });
				}
			};
		});
	};

	const saveLocalFile = (id, blob) => {
		cachedDownloads[id] = blob;
	};

	const saveDownloadingPromise = (id, promise = new Promise()) => {
		cachedDownloadPromises[id] = promise;
		promise.then(() => {
			delete cachedDownloadPromises[id];
		});
	};

	const getLocalFile = id => {
		return cachedDownloads[id] || cachedDownloadPromises[id];
	};

	return {
		downloadRequest,
		downloadCheck,
		uploadFile,
		saveLocalFile,
		getLocalFile,
		saveDownloadingPromise,
	};
}
