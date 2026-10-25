// PWA用アイコン(PNG)を外部ライブラリなしで描く。夜の盤面に4色のつぶ。
// 出力: app/icons/icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, px) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const BG = hex('#1d1b2e'), C = [hex('#ff5a6e'), hex('#4fd27a'), hex('#4aa3ff'), hex('#ffd34d')], HI = hex('#ffffff');
function draw(size, pad) {
  const S = 4, px = Buffer.alloc(size * size * 4), sc = 1 - 2 * pad, u = v => v * sc + pad;
  const balls = [[0.33, 0.67, 0], [0.67, 0.67, 2], [0.33, 0.33, 1], [0.67, 0.33, 3]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const acc = [0, 0, 0];
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      const fx = (x + (sx + 0.5) / S) / size, fy = (y + (sy + 0.5) / S) / size;
      let col = BG;
      for (const [bx, by, ci] of balls) {
        const dx = fx - u(bx), dy = fy - u(by);
        if (dx * dx + dy * dy < (0.155 * sc) ** 2) col = C[ci];
        const hx = fx - u(bx - 0.05), hy = fy - u(by - 0.06);
        if (hx * hx + hy * hy < (0.04 * sc) ** 2) col = HI;
      }
      acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2];
    }
    const i = (y * size + x) * 4; px[i] = acc[0] / 16; px[i + 1] = acc[1] / 16; px[i + 2] = acc[2] / 16; px[i + 3] = 255;
  }
  return png(size, size, px);
}
const out = path.join(__dirname, '../app/icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-192.png'), draw(192, 0.03));
fs.writeFileSync(path.join(out, 'icon-512.png'), draw(512, 0.03));
fs.writeFileSync(path.join(out, 'maskable-512.png'), draw(512, 0.14));
fs.writeFileSync(path.join(out, 'apple-touch-icon.png'), draw(180, 0.05));
console.log('icons written');
