// import RandomBytes from 'randombytes'

const getRandom = arr => {
	const ln = arr.length;
	const ab = new Uint8Array(ln);
	const buf = crypto.getRandomValues(ab);
	for (let i = 0; i < ln; i++) {
		arr[i] = buf[i];
	}
	return arr;
};

export default getRandom;
