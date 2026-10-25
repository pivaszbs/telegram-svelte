// Keep the encoder's matrix and quiet zone intact while rounding exposed corners.
export function renderQr(encoder, url) {
  const { modules } = encoder.create(url, { errorCorrectionLevel: 'H' });
  const n = modules.size;
  const dark = (x, y) => x >= 0 && y >= 0 && x < n && y < n && modules.get(y, x);
  const finders = [[0, 0], [n - 7, 0], [0, n - 7]];
  let shapes = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!dark(x, y) || finders.some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7)) continue;
    const tl = !dark(x - 1, y) && !dark(x, y - 1) ? .45 : 0;
    const tr = !dark(x + 1, y) && !dark(x, y - 1) ? .45 : 0;
    const br = !dark(x + 1, y) && !dark(x, y + 1) ? .45 : 0;
    const bl = !dark(x - 1, y) && !dark(x, y + 1) ? .45 : 0;
    shapes += `<path d="M${x + tl} ${y}H${x + 1 - tr}q${tr} 0 ${tr} ${tr}V${y + 1 - br}q0 ${br} ${-br} ${br}H${x + bl}q${-bl} 0 ${-bl} ${-bl}V${y + tl}q0 ${-tl} ${tl} ${-tl}Z"/>`;
  }
  for (const [x, y] of finders) shapes += `<rect x="${x}" y="${y}" width="7" height="7" rx="1.8"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1" fill="white"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".7"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${n + 8} ${n + 8}"><rect x="-4" y="-4" width="${n + 8}" height="${n + 8}" fill="white"/><g fill="#000">${shapes}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
