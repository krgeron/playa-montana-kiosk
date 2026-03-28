/**
 * Generates icon-192.png and icon-512.png in public/ using only Node.js built-ins.
 * Run once: node generate-icons.js
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

// ── PNG chunk builder ─────────────────────────────────────────────────────
function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([len, typeBytes, data, crcVal])
}

// ── Create a solid-color PNG ──────────────────────────────────────────────
function createPNG(size, r, g, b) {
  // IHDR: width, height, bitDepth=8, colorType=2(RGB), compress=0, filter=0, interlace=0
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr.writeUInt8(8, 8)   // bit depth
  ihdr.writeUInt8(2, 9)   // color type: RGB
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)

  // Scanlines: each row = [0, R, G, B, R, G, B, ...]  (filter byte = 0)
  const row = Buffer.alloc(1 + size * 3)
  row[0] = 0 // filter: None
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r
    row[2 + x * 3] = g
    row[3 + x * 3] = b
  }
  const scanlines = Buffer.concat(Array(size).fill(row))
  const idat = zlib.deflateSync(scanlines, { level: 6 })

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Generate icons ────────────────────────────────────────────────────────
// Brand teal: #4CBEB5 → R=76 G=190 B=181
const R = 76, G = 190, B = 181
const outDir = path.join(__dirname, 'public')

fs.mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const file = path.join(outDir, `icon-${size}.png`)
  fs.writeFileSync(file, createPNG(size, R, G, B))
  console.log(`Generated ${file}`)
}

console.log('Done. Icons are solid #4CBEB5 (brand teal).')
console.log('Replace them with proper artwork before deploying to production.')
