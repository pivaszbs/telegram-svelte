import bigInt from 'big-integer';

function wm(t) {
	const e = new Uint8Array(t);
	return crypto.getRandomValues(e), e;
}
function $m(t) {
	const e = new Array(t.byteLength);
	for (let s = 0; s < t.byteLength; s++) {
		e[s] = t[s] < 16 ? '0' + t[s].toString(16) : t[s].toString(16);
	}
	return bigInt(e.join(''), 16);
}
function ym(t, e) {
	return bm(t.toString(16), e);
}
function bm(t, e) {
	for (e || (e = Math.ceil(t.length / 2)); t.length < 2 * e; ) {
		t = '0' + t;
	}
	const s = new Uint8Array(e);
	for (let n = 0; n < e; n++) {
		s[n] = parseInt(t.slice(2 * n, 2 * n + 2), 16);
	}
	return s;
}
function Cm(...t) {
	let e = 0;
	for (let s of t) {
		'number' == typeof s ? (e = Math.ceil(e / s) * s) : (e += s.byteLength);
	}
	let s = new Uint8Array(e),
		n = 0;
	for (let i of t) {
		'number' == typeof i
			? s.set(wm(e - n), n)
			: (s.set(i instanceof ArrayBuffer ? new Uint8Array(i) : i, n), (n += i.byteLength));
	}
	return s;
}

async function mm(t) {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', t));
}
const xm = mm,
	Pm = (t, e) => mm(Cm(e, t, e));
const Am = async (t, e, s) =>
	await Pm(
		await (async function(t, e, s, n) {
			return new Uint8Array(
				await crypto.subtle.deriveBits(
					{ name: 'PBKDF2', hash: t, salt: s, iterations: n },
					await crypto.subtle.importKey('raw', e, { name: 'PBKDF2' }, !1, ['deriveBits']),
					512
				)
			);
		})('SHA-512', await (async (t, e, s) => await Pm(await Pm(t, e), s))(t, e, s), e, 1e5),
		s
	);

function km(t, e) {
	let s = new Uint8Array(t.byteLength);
	for (let n = 0; n < t.byteLength; n++) {
		s[n] = t[n] ^ e[n];
	}
	return s;
}

export const getParams = async (t, e, s, n, i, r) => {
	const a = new TextEncoder(),
		o = bigInt(e);
	e = ym(o, 256);
	const c = $m(s),
		h = $m(wm(256)),
		l = ym(o.modPow(h, c)),
		u = $m(r),
		d = $m(await xm(Cm(s, e))),
		p = $m(await xm(Cm(l, r))),
		g = $m(await Am(a.encode(t), n, i)),
		m = o.modPow(g, c),
		f = d.multiply(m).mod(c);
	let w = u.subtract(f).mod(c);
	w.isNegative() && (w = w.add(c));
	const $ = ym(w.modPow(h.add(p.multiply(g)), c)),
		y = await xm($);
	return { A: l, M1: await xm(Cm(km(await xm(s), await xm(e)), await xm(n), await xm(i), l, r, y)) };
};
