const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUDGETS = {
  entryChunk: { name: 'Main Entry JS (index-*.js)', maxRawKb: 420, maxGzipKb: 110 },
  routeChunk: { name: 'Route Page JS (*Page-*.js)', maxRawKb: 150, maxGzipKb: 35 },
  cssChunk: { name: 'Main CSS (index-*.css)', maxRawKb: 220, maxGzipKb: 35 }
};

const assetsDir = path.resolve(__dirname, '../dist/assets');

if (!fs.existsSync(assetsDir)) {
  console.error('[Budget Error] dist/assets directory not found!');
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
let violations = 0;

console.log('\n========================================');
console.log('⚡ PERFORMANCE BUDGET VERIFICATION');
console.log('========================================');

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  const content = fs.readFileSync(filePath);
  const rawKb = (content.length / 1024).toFixed(1);
  const gzipKb = (zlib.gzipSync(content).length / 1024).toFixed(1);

  if (file.startsWith('index-') && file.endsWith('.js')) {
    const b = BUDGETS.entryChunk;
    const ok = rawKb <= b.maxRawKb && gzipKb <= b.maxGzipKb;
    console.log(`${ok ? '✅' : '⚠️'} [Entry] ${file}: ${rawKb} KB raw (budget: ${b.maxRawKb} KB) | ${gzipKb} KB gzip (budget: ${b.maxGzipKb} KB)`);
    if (!ok) violations++;
  } else if (file.includes('Page-') && file.endsWith('.js')) {
    const b = BUDGETS.routeChunk;
    const ok = rawKb <= b.maxRawKb && gzipKb <= b.maxGzipKb;
    console.log(`${ok ? '✅' : '⚠️'} [Route] ${file}: ${rawKb} KB raw (budget: ${b.maxRawKb} KB) | ${gzipKb} KB gzip (budget: ${b.maxGzipKb} KB)`);
    if (!ok) violations++;
  } else if (file.startsWith('index-') && file.endsWith('.css')) {
    const b = BUDGETS.cssChunk;
    const ok = rawKb <= b.maxRawKb && gzipKb <= b.maxGzipKb;
    console.log(`${ok ? '✅' : '⚠️'} [CSS] ${file}: ${rawKb} KB raw (budget: ${b.maxRawKb} KB) | ${gzipKb} KB gzip (budget: ${b.maxGzipKb} KB)`);
    if (!ok) violations++;
  }
});

console.log('========================================');
if (violations > 0) {
  console.warn(`⚠️ Warning: ${violations} performance budget limits exceeded!`);
} else {
  console.log('✅ ALL PERFORMANCE BUDGETS MET PERFECTLY!\n');
}
