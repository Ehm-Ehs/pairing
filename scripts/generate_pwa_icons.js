import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPngBuffer(width, height, drawPixel) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth (8 bits per channel)
  ihdr[9] = 6; // Color type (6 = RGBA)
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with scanline filter bytes (0 = None)
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Compress raw pixel data with zlib
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  
  // Calculate CRC32
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, body, crcBuf]);
}

// Pre-computed CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Draw PairForm PWA Icon Pixel Function
function drawPairFormIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates to 0..1
  const nx = x / w;
  const ny = y / h;

  // Background style: Rounded square container or full bleed for maskable
  let bgR = 59, bgG = 130, bgB = 246, bgA = 255; // #3b82f6 (PairForm Blue)
  
  // If not maskable, give it rounded corners with drop shadow
  if (!isMaskable) {
    const cornerRadius = 0.22; // 22% corner radius (iOS style)
    const margin = 0.04;
    
    // Check bounding box inside margin
    if (nx < margin || nx > 1 - margin || ny < margin || ny > 1 - margin) {
      return [0, 0, 0, 0]; // Transparent padding
    }

    // Normalized inside margin
    const mx = (nx - margin) / (1 - 2 * margin);
    const my = (ny - margin) / (1 - 2 * margin);

    // Corner radius check
    let dx = 0, dy = 0;
    if (mx < cornerRadius) dx = cornerRadius - mx;
    else if (mx > 1 - cornerRadius) dx = mx - (1 - cornerRadius);

    if (my < cornerRadius) dy = cornerRadius - my;
    else if (my > 1 - cornerRadius) dy = my - (1 - cornerRadius);

    if (dx > 0 && dy > 0 && (dx * dx + dy * dy > cornerRadius * cornerRadius)) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }
  }

  // Draw pair icon geometry (two connected nodes / people silhouettes) inside center area
  const cx = 0.5, cy = 0.5;
  const dx = nx - cx;
  const dy = ny - cy;
  
  // Left Node (Person 1) head & body
  const head1Dist = Math.hypot(nx - 0.36, ny - 0.38);
  const head2Dist = Math.hypot(nx - 0.64, ny - 0.38);
  
  const body1Dist = Math.hypot(nx - 0.34, ny - 0.64);
  const body2Dist = Math.hypot(nx - 0.66, ny - 0.64);

  // White nodes with slight opacity gradient
  if (head1Dist < 0.12 || head2Dist < 0.12) {
    return [255, 255, 255, 255]; // Crisp white head nodes
  }

  if (body1Dist < 0.18 || body2Dist < 0.18) {
    if (ny >= 0.52) {
      return [255, 255, 255, 240]; // Crisp white body nodes
    }
  }

  // Connection bridge between pair nodes
  if (Math.abs(ny - 0.52) < 0.035 && nx >= 0.34 && nx <= 0.66) {
    return [255, 255, 255, 255];
  }

  // Background blue gradient
  const grad = Math.floor(ny * 40);
  return [
    Math.max(0, bgR - grad),
    Math.max(0, bgG - grad),
    Math.min(255, bgB + 10),
    bgA
  ];
}

const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
const iconSpecs = [
  { name: 'icon-192x192.png', size: 192, maskable: false },
  { name: 'icon-512x512.png', size: 512, maskable: false },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'maskable-icon-512x512.png', size: 512, maskable: true },
];

for (const spec of iconSpecs) {
  const filePath = path.join(iconsDir, spec.name);
  const buffer = createPngBuffer(spec.size, spec.size, (x, y, w, h) => drawPairFormIcon(x, y, w, h, spec.maskable));
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${spec.name} (${spec.size}x${spec.size}, ${buffer.length} bytes)`);
}
