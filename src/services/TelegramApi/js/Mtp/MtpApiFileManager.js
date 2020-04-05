import { nextRandomInt } from '../lib/bin_utils';
import { noop, isFunction } from '../Etc/Helper';
import logger from '../lib/logger';
import $timeout from '../Etc/angular/$timeout';
import FileSaverModule from '../Etc/FileSaver';
import AppPeersManager from '../App/AppPeersManager';
import MtpApiManager from './MtpApiManager';
import pako from 'pako';

import lottie from 'lottie-web';

function MtpApiFileManagerModule() {
	let cachedDownloadPromises = {};
	let cachedDownloads = {};

	let downloadPulls = {};
	let downloadActives = {};

	let FileSaver = new FileSaverModule();

	const downloadRequest = (dcID, cb, activeDelta) => {
		if (downloadPulls[dcID] === undefined) {
			downloadPulls[dcID] = [];
			downloadActives[dcID] = 0;
		}

		const downloadPull = downloadPulls[dcID];
		return new Promise((resolve, reject) => {
			downloadPull.push({
				cb: cb,
				resolve: resolve,
				reject: reject,
				activeDelta: activeDelta,
			});
			setZeroTimeout(() => {
				downloadCheck(dcID);
			});
		});
	};

	const downloadCheck = dcID => {
		const downloadPull = downloadPulls[dcID];
		const downloadLimit = dcID == 'upload' ? 11 : 5;

		if (
			downloadActives[dcID] >= downloadLimit ||
			!downloadPull ||
			!downloadPull.length
		) {
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
							return new Promise(
								(uploadResolve, uploadReject) => {
									// var uploadDeferred = new Promise();

									const reader = new FileReader();
									const blob = file.slice(
										offset,
										offset + partSize
									);

									reader.onloadend = e => {
										if (canceled) {
											uploadReject();
											return;
										}
										if (
											e.target.readyState !=
											FileReader.DONE
										) {
											return;
										}
										MtpApiManager.invokeApi(
											isBigFile
												? 'upload.saveBigFilePart'
												: 'upload.saveFilePart',
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
												logger(
													'Progress',
													(doneParts * partSize) /
														fileSize
												);
												progress(
													offset < fileSize
														? offset
														: fileSize,
													fileSize
												);
												// resolve({ done: doneParts * partSize, total: fileSize });
											}
										}, errorHandler);
									};

									reader.readAsArrayBuffer(blob);
								}
							);
						},
						activeDelta
					);
				})(offset, part++);
			}

			const cancel = () => {
				logger('cancel upload', canceled, resolved);
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

	const downloadDocument = (
		doc,
		progress = noop,
		autosave,
		useCached = true
	) => {
		doc = doc || {};
		doc.id = doc.id || 0;
		doc.access_hash = doc.access_hash || 0;
		doc.attributes = doc.attributes || [];
		doc.size = doc.size || 0;

		const cached = getLocalFile(doc.id);

		if (cached && useCached) {
			return new Promise(resolve => {
				resolve(cached);
			});
		}

		const location = {
			_: 'inputDocumentFileLocation',
			id: doc.id,
			access_hash: doc.access_hash,
			file_reference: doc.file_reference,
		};
		let fileName = 'FILE';
		let size = 15728640;
		let limit = 524288;
		let offset = 0;
		const promise = new Promise(resolve => {
			const bytes = [];

			size = doc.size;

			forEach(doc.attributes, attr => {
				if (attr._ == 'documentAttributeFilename') {
					fileName = attr.file_name;
				}
			});

			const download = () => {
				if (offset < size) {
					MtpApiManager.invokeApi('upload.getFile', {
						location: location,
						offset: offset,
						limit: limit,
					}).then(result => {
						bytes.push(result.bytes);
						offset += limit;
						progress(offset < size ? offset : size, size);
						download();
					});
				} else {
					if (autosave) {
						FileSaver.save(bytes, fileName);
					}
					resolve({
						bytes: bytes,
						fileName: fileName,
						type: doc.mime_type,
					});
				}
			};

			$timeout(download);
		});
		saveDownloadingPromise(doc.id, promise);
		return promise;
	};

	const sendFile = async (
		params = {
			id: 0,
			file: {},
			caption: '',
		},
		inputType,
		progressHandler = noop
	) => {
		const peer = AppPeersManager.getPeer(params.id);

		return uploadFile(params.file, progressHandler).then(inputFile => {
			const file = params.file;

			inputFile.name = file.name;

			const inputMedia = {
				_: inputType || 'inputMediaUploadedDocument',
				file: inputFile,
				mime_type: file.type,
				attributes: [
					{ _: 'documentAttributeFilename', file_name: file.name },
				],
			};

			return MtpApiManager.invokeApi('messages.sendMedia', {
				peer,
				media: inputMedia,
				message: params.caption,
				random_id: [
					nextRandomInt(0xffffffff),
					nextRandomInt(0xffffffff),
				],
			});
		});
	};

	const downloadPhoto = (
		photo,
		progress = noop,
		autosave,
		useCached = true
	) => {
		const photoSize = photo.sizes[photo.sizes.length - 1];
		const location = {
			_: 'inputPhotoFileLocation',
			id: photo.id,
			access_hash: photo.access_hash,
			file_reference: photo.file_reference,
			thumb_size: 'c',
		};

		const cached = getLocalFile(photo.id);

		if (cached && useCached) {
			return new Promise(resolve => {
				resolve(cached);
			});
		}

		const fileName = photo.id + '.jpg';
		let size = 15728640;
		let limit = 524288;
		let offset = 0;

		const promise = new Promise(resolve => {
			const bytes = [];

			if (photoSize.size > size) {
				throw new Error('Big file not supported');
			}

			size = photoSize.size;

			const download = () => {
				if (offset < size) {
					MtpApiManager.invokeApi('upload.getFile', {
						location: location,
						offset: offset,
						limit: limit,
					}).then(result => {
						bytes.push(result.bytes);
						offset += limit;
						progress(offset < size ? offset : size, size);
						download();
					});
				} else {
					if (autosave) {
						FileSaver.save(bytes, fileName);
					}
					resolve({
						bytes: bytes,
						fileName: fileName,
						type: 'image/jpeg',
					});
				}
			};

			$timeout(download);
		});
		saveDownloadingPromise(photo.id, promise);
		return promise;
	};

	const getDocumentPreview = doc => {
		const cached = getLocalFile(doc.id);
		if (cached) {
			return new Promise(resolve => {
				resolve(cached);
			});
		}

		const location = { ...doc };
		let limit = 524288;

		let thumb_size = doc.thumbs;
		if (thumb_size) {
			thumb_size = thumb_size[2] || thumb_size[1] || thumb_size[0];
			location.thumb_size = thumb_size.type;
		} else {
			return new Promise(resolve => {
				resolve({});
			});
		}

		location._ = 'inputDocumentFileLocation';

		const promise = MtpApiManager.invokeApi('upload.getFile', {
			location: location,
			offset: 0,
			limit: limit,
		}).then(res => {
			return _getImageData(res.bytes, doc.id);
		});
		saveDownloadingPromise(doc.id, promise);
		return promise;
	};

	const getPhotoPreview = photo => {
		const cached = getLocalFile(photo.id);
		if (cached) {
			return new Promise(resolve => {
				resolve(cached);
			});
		}

		let photo_size = photo.sizes;
		photo_size = photo_size[2] || photo_size[1] || photo_size[0];
		const location = {
			_: 'inputPhotoFileLocation',
			id: photo.id,
			access_hash: photo.access_hash,
			file_reference: photo.file_reference,
			thumb_size: photo_size.type,
		};
		let limit = 524288;

		const promise = MtpApiManager.invokeApi('upload.getFile', {
			location: location,
			offset: 0,
			limit: limit,
		}).then(data => _getImageData(data.bytes, photo.id));
		saveDownloadingPromise(photo.id, promise);
		return promise;
	};

	const getPeerPhoto = async peer_id => {
		const peer = AppPeersManager.getPeer(peer_id);

		if (!peer.photo) {
			return;
		}

		const cached = getLocalFile(peer.id);

		if (cached) {
			return cached;
		}

		const photo = peer.photo.photo_small;
		const promise = MtpApiManager.invokeApi('upload.getFile', {
			location: {
				_: 'inputPeerPhotoFileLocation',
				peer: AppPeersManager.getInputPeerByID(peer_id),
				volume_id: photo.volume_id,
				local_id: photo.local_id,
			},
			offset: 0,
			limit: 1048576,
		}).then(photo_file => {
			return _getImageData(photo_file.bytes, peer.id);
		});
		saveDownloadingPromise(peer.id, promise);
		return promise;
	};

	const _getImageData = async (bytes, id) => {
		if (!(bytes instanceof Uint8Array)) {
			return bytes;
		}
		const data = window.URL.createObjectURL(
			new Blob([bytes], { type: 'image/png' })
		);
		if (id) {
			saveLocalFile(id, data);
		}
		return data;
	};

	const _getVideoData = async (bytes, id) => {
		if (!(bytes instanceof Array)) {
			return bytes;
		}
		const blob = new Blob(bytes, { type: 'video/mp4' });
		console.log('BLOB', blob);
		const data = window.URL.createObjectURL(blob);
		if (id) {
			saveLocalFile(id, { bytes: data });
		}
		return data;
	};

	const _getStickerData = async (sticker, id) => {
		if (!(sticker instanceof Array)) {
			logger('GOT CACHED', sticker);
			return sticker;
		}
		const decoded_text = new TextDecoder('utf-8').decode(
			await pako.inflate(sticker[0])
		);
		const data = JSON.parse(decoded_text);
		if (id) {
			logger('SAVING', data);
			saveLocalFile(id, { bytes: data });
		}
		return data;
	};

	const setStickerToContainer = (sticker, container, cacheId) => {
		return _getStickerData(sticker.bytes, cacheId).then(st => {
			return lottie.loadAnimation({
				container: container,
				renderer: 'svg',
				loop: true,
				autoplay: false,
				animationData: st,
			});
		});
	};

	return {
		downloadRequest,
		downloadCheck,
		uploadFile,
		saveLocalFile,
		getLocalFile,
		saveDownloadingPromise,
		downloadDocument,
		sendFile,
		downloadPhoto,
		getDocumentPreview,
		getPhotoPreview,
		setStickerToContainer,
		getPeerPhoto,
	};
}

export default MtpApiFileManagerModule();
