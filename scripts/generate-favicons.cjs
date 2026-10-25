const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. High-Resolution Vector SVG Favicon for Prestige Hotels
// Features: Dark royal charcoal background (#14120E), royal 24k gold gradient, architectural arches and 5-star crown
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="prestigeGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3E5AB" />
      <stop offset="30%" stop-color="#DFBE72" />
      <stop offset="70%" stop-color="#C9A24B" />
      <stop offset="100%" stop-color="#9A772B" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1C18" />
      <stop offset="100%" stop-color="#0E0D0B" />
    </linearGradient>
    <linearGradient id="innerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#DFBE72" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#DFBE72" stop-opacity="0.02" />
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#C9A24B" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Dark Royal Rounded Squircle Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  
  <!-- Outer Gold Border -->
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="url(#prestigeGold)" stroke-width="8" stroke-opacity="0.85" />
  
  <!-- Subtle Inner Inset Border -->
  <rect x="32" y="32" width="448" height="448" rx="80" fill="url(#innerGlow)" stroke="url(#prestigeGold)" stroke-width="2" stroke-opacity="0.3" />

  <g filter="url(#goldGlow)">
    <!-- 5-Star Luxury Crown on Top -->
    <!-- Center Star -->
    <path d="M256 92 L261 106 L276 106 L264 115 L268 129 L256 120 L244 129 L248 115 L236 106 L251 106 Z" fill="url(#prestigeGold)" />
    <!-- Left Inner Star -->
    <path d="M208 108 L212 119 L224 119 L214 126 L217 137 L208 130 L199 137 L202 126 L192 119 L204 119 Z" fill="url(#prestigeGold)" transform="scale(0.85) translate(40, 20)" />
    <!-- Right Inner Star -->
    <path d="M304 108 L308 119 L320 119 L310 126 L313 137 L304 130 L295 137 L298 126 L288 119 L300 119 Z" fill="url(#prestigeGold)" transform="scale(0.85) translate(46, 20)" />

    <!-- Royal Monogram / Hotel Arch Icon -->
    <!-- Main Monumental Islamic/Royal Arch -->
    <path d="M256 148 C186 148 132 202 132 272 L132 400 C132 406 138 412 144 412 L368 412 C374 412 380 406 380 400 L380 272 C380 202 326 148 256 148 Z" 
          fill="none" 
          stroke="url(#prestigeGold)" 
          stroke-width="16" 
          stroke-linejoin="round" />

    <!-- Inner Keyhole / Mosque Sanctuary Arch -->
    <path d="M256 196 C216 196 184 228 184 268 L184 412 L328 412 L328 268 C328 228 296 196 256 196 Z" 
          fill="none" 
          stroke="url(#prestigeGold)" 
          stroke-width="10" 
          stroke-linejoin="round" />

    <!-- Central Prestige Monogram "P" Crown Column -->
    <!-- Stylized Iconic "P" in the Center -->
    <path d="M232 248 L232 376 M232 248 L268 248 C288 248 300 260 300 276 C300 292 288 304 268 304 L232 304" 
          fill="none" 
          stroke="url(#prestigeGold)" 
          stroke-width="18" 
          stroke-linecap="round" 
          stroke-linejoin="round" />
          
    <!-- Base Pedestal Line -->
    <line x1="112" y1="412" x2="400" y2="412" stroke="url(#prestigeGold)" stroke-width="14" stroke-linecap="round" />
  </g>
</svg>`;

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

  console.log('[favicon-gen] Generating SVG & high-res PNG favicons...');

  // 1. Write SVG
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Generate required sizes
  const sizes = [
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'favicon-192x192.png', size: 192 },
    { name: 'favicon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'images/brand/favicon.png', size: 192 }
  ];

  const generatedPngs = [];

  for (const target of sizes) {
    const buf = await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png({ compressionLevel: 9 })
      .toBuffer();

    const targetPath = path.join(publicDir, target.name);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buf);
    console.log(`[favicon-gen] Created ${target.name} (${target.size}x${target.size})`);

    if ([16, 32, 48].includes(target.size) || target.size === 48) {
      generatedPngs.push({ width: target.size, height: target.size, buffer: buf });
    }
  }

  // Also generate 16x16 and 32x32 for the ICO file
  const buf16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const buf32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const buf48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

  // 3. Generate multi-resolution favicon.ico
  const icoBuffer = buildIco([
    { width: 16, height: 16, buffer: buf16 },
    { width: 32, height: 32, buffer: buf32 },
    { width: 48, height: 48, buffer: buf48 }
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('[favicon-gen] Created multi-resolution binary favicon.ico (16, 32, 48px)');

  // 4. Create Web App Manifest (site.webmanifest)
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
    console.log('[favicon-gen] Synced all favicon assets to dist/');
  }

  console.log('[favicon-gen] ✅ All favicon assets successfully generated!');
}

main().catch(console.error);
