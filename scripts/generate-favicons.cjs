const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Helper function to build a standard multi-size Windows ICO buffer from PNG buffers
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  // Header: 6 bytes (idReserved: 2 bytes = 0, idType: 2 bytes = 1, idCount: 2 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(count, 4); // number of images

  const dirEntries = [];
  let currentOffset = 6 + count * 16;

  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0); // width
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1); // height
    entry.writeUInt8(0, 2); // color palette (0 for no palette)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // offset of image data

    dirEntries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(b => b.buffer)]);
}

async function main() {
  const publicDir = path.resolve(__dirname, '../public');
  const distDir = path.resolve(__dirname, '../dist');
  const brandDir = path.join(publicDir, 'images/brand');
  fs.mkdirSync(brandDir, { recursive: true });

  // Source master brand logo
  let masterPath = path.join(publicDir, 'brand-user-logo.png');
  if (!fs.existsSync(masterPath)) {
    masterPath = path.join(brandDir, 'logo.png');
  }

  console.log('[favicon-gen] Using master logo from:', masterPath);
  const masterBuf = fs.readFileSync(masterPath);

  // 1. Generate Full Brand Logos (Optimized WebP, PNG, Header thumbnail)
  console.log('[favicon-gen] Generating optimized brand logos...');
  const logo512Webp = await sharp(masterBuf)
    .resize(512, 512, { fit: 'contain', background: { r: 245, g: 241, b: 232, alpha: 0 } })
    .webp({ quality: 90 })
    .toBuffer();
  fs.writeFileSync(path.join(brandDir, 'logo.webp'), logo512Webp);
  fs.writeFileSync(path.join(brandDir, 'about_logo.webp'), logo512Webp);

  const logo512Png = await sharp(masterBuf)
    .resize(512, 512, { fit: 'contain', background: { r: 245, g: 241, b: 232, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(brandDir, 'logo.png'), logo512Png);
  fs.writeFileSync(path.join(brandDir, 'about_logo.png'), logo512Png);

  // Ultra-fast header thumbnail (128x128 WebP ~5KB)
  const logoHeaderWebp = await sharp(masterBuf)
    .resize(128, 128, { fit: 'contain', background: { r: 245, g: 241, b: 232, alpha: 0 } })
    .webp({ quality: 85 })
    .toBuffer();
  fs.writeFileSync(path.join(brandDir, 'logo-header.webp'), logoHeaderWebp);
  console.log('[favicon-gen] Created brand logo assets (WebP 512, PNG 512, Header 128)');

  // 2. Extract Authentic Golden "P" Medallion for Favicon Suite
  // Coordinates in 1254x1254 master: center X=627, center Y=418, diameter=348
  const cropSize = 348;
  const cropLeft = 627 - Math.round(cropSize / 2);
  const cropTop = 418 - Math.round(cropSize / 2);

  const circleMask = Buffer.from(
    `<svg width="${cropSize}" height="${cropSize}">
      <circle cx="${cropSize / 2}" cy="${cropSize / 2}" r="${cropSize / 2 - 1}" fill="white" />
    </svg>`
  );

  const medallionMaster = await sharp(masterBuf)
    .extract({ left: cropLeft, top: cropTop, width: cropSize, height: cropSize })
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  console.log('[favicon-gen] Extracted circular golden medallion master (' + cropSize + 'x' + cropSize + ')');

  // 3. Generate Multi-Resolution Favicon Suite for Google Search & Browsers
  const sizes = [
    { name: 'favicon-48x48.png', size: 48 },   // Google Search requirement (multiple of 48)
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'favicon-192x192.png', size: 192 }, // Android Chrome & PWA
    { name: 'favicon-512x512.png', size: 512 }, // PWA High-res splash
    { name: 'apple-touch-icon.png', size: 180 },// iOS Safari
    { name: 'images/brand/favicon.png', size: 192 }
  ];

  for (const target of sizes) {
    const buf = await sharp(medallionMaster)
      .resize(target.size, target.size)
      .png({ compressionLevel: 9 })
      .toBuffer();

    const targetPath = path.join(publicDir, target.name);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buf);
    console.log(`[favicon-gen] Created ${target.name} (${target.size}x${target.size}, ${buf.length} bytes)`);
  }

  // 4. Generate multi-resolution binary favicon.ico (16, 32, 48px)
  const buf16 = await sharp(medallionMaster).resize(16, 16).png().toBuffer();
  const buf32 = await sharp(medallionMaster).resize(32, 32).png().toBuffer();
  const buf48 = await sharp(medallionMaster).resize(48, 48).png().toBuffer();

  const icoBuffer = buildIco([
    { width: 16, height: 16, buffer: buf16 },
    { width: 32, height: 32, buffer: buf32 },
    { width: 48, height: 48, buffer: buf48 }
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('[favicon-gen] Created multi-resolution binary favicon.ico (16, 32, 48px)');

  // 5. Generate lightweight SVG Favicon (compact ~4KB instead of 97KB)
  const medallionWebpBase64 = (await sharp(medallionMaster).resize(96, 96).webp({ quality: 90 }).toBuffer()).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs>
    <clipPath id="circleClip">
      <circle cx="48" cy="48" r="47" />
    </clipPath>
  </defs>
  <image href="data:image/webp;base64,${medallionWebpBase64}" width="96" height="96" clip-path="url(#circleClip)" />
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  console.log('[favicon-gen] Created ultra-lightweight SVG favicon (~4KB)');

  // 6. Create Web App Manifest (site.webmanifest)
  const manifest = {
    name: "برستيج لإدارة وتشغيل الفنادق | Prestige Hotels Management",
    short_name: "برستيج للفنادق | Prestige Hotels",
    description: "شركة رائدة في إدارة وتشغيل الفنادق وتقديم أرقى حلول الضيافة والتسكين في مكة المكرمة والمدينة المنورة | Premier Hotel Management and Operations in Makkah & Madinah",
    start_url: "/",
    display: "standalone",
    background_color: "#14120E",
    theme_color: "#14120E",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png"
      },
      {
        src: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png"
      },
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };

  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('[favicon-gen] Created site.webmanifest and manifest.json');

  // Copy to dist if dist exists
  if (fs.existsSync(distDir)) {
    const filesToCopy = [
      'favicon.svg',
      'favicon.ico',
      'favicon-48x48.png',
      'favicon-96x96.png',
      'favicon-192x192.png',
      'favicon-512x512.png',
      'apple-touch-icon.png',
      'site.webmanifest',
      'manifest.json'
    ];
    for (const file of filesToCopy) {
      const src = path.join(publicDir, file);
      const dest = path.join(distDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }
    const distBrandDir = path.join(distDir, 'images/brand');
    fs.mkdirSync(distBrandDir, { recursive: true });
    fs.copyFileSync(path.join(brandDir, 'logo.webp'), path.join(distBrandDir, 'logo.webp'));
    fs.copyFileSync(path.join(brandDir, 'logo.png'), path.join(distBrandDir, 'logo.png'));
    fs.copyFileSync(path.join(brandDir, 'logo-header.webp'), path.join(distBrandDir, 'logo-header.webp'));
    fs.copyFileSync(path.join(brandDir, 'favicon.png'), path.join(distBrandDir, 'favicon.png'));
    console.log('[favicon-gen] Synced all favicon assets to dist/');
  }

  console.log('[favicon-gen] ✅ All authentic brand favicon assets successfully generated!');
}

main().catch(console.error);
