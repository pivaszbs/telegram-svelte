export default class $http {
	static post = (url, data) => {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();

			xhr.open('POST', url, true);
			xhr.responseType = 'arraybuffer';
			xhr.onload = () => {
				const result = { data: xhr.response };
				xhr.status == 200 ? resolve(result) : reject(result);
			};
			xhr.onerror = xhr.onabort = () => {
				reject({ status: xhr.status });
			};
			xhr.send(data);
		});
	};
}
