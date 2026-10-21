import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const URLS = [
  { name: 'Home', url: 'https://prestige-ksa.web.app/' },
  { name: 'Hotels List', url: 'https://prestige-ksa.web.app/hotels' },
  { name: 'Hotel Details', url: 'https://prestige-ksa.web.app/hotels/prestige-ajyad' },
  { name: 'Booking Page', url: 'https://prestige-ksa.web.app/bookings' },
  { name: 'About', url: 'https://prestige-ksa.web.app/about' },
  { name: 'Contact', url: 'https://prestige-ksa.web.app/contact' }
];

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const results = { mobile: [], desktop: [] };

async function runLighthouse(url, preset = 'mobile') {
  const tmpFile = path.resolve(`temp-lh-${preset}.json`);
  const formFactorFlag = preset === 'desktop' ? '--preset=desktop' : '--form-factor=mobile --screenEmulation.mobile=true';
  const cmd = `node ./node_modules/lighthouse/cli/index.js "${url}" --chrome-flags="--headless=new --no-sandbox" ${formFactorFlag} --output=json --only-categories=performance --quiet --output-path="${tmpFile}"`;

  try {
    execSync(cmd, {
      env: { ...process.env, CHROME_PATH },
      stdio: 'pipe',
      timeout: 120000
    });
    const report = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

    const audits = report.audits;
    const score = Math.round((report.categories?.performance?.score || 0) * 100);
    const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
    const lcpNum = audits['largest-contentful-paint']?.numericValue || 0;
    const cls = audits['cumulative-layout-shift']?.displayValue || '0';
    const tbt = audits['total-blocking-time']?.displayValue || '0 ms';
    const inp = audits['interaction-to-next-paint']?.displayValue || audits['max-potential-fid']?.displayValue || 'N/A';

    const items = audits['network-requests']?.details?.items || [];
    let jsBytes = 0;
    let imgBytes = 0;
    items.forEach(item => {
      const size = item.resourceSize || item.transferSize || 0;
      if (item.resourceType === 'Script') jsBytes += size;
      if (item.resourceType === 'Image') imgBytes += size;
    });

    return {
      score,
      lcp,
      lcpNum,
      inp,
      cls,
      tbt,
      jsKB: Math.round(jsBytes / 1024),
      imgKB: Math.round(imgBytes / 1024),
      requests: items.length
    };
  } catch (err) {
    console.error(`Error running lighthouse for ${url} (${preset}):`, err.message);
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    return null;
  }
}

async function main() {
  console.log('--- STARTING LIGHTHOUSE AUDIT FOR BEFORE BENCHMARKS ---');
  for (const item of URLS) {
    console.log(`Auditing [Mobile] ${item.name}: ${item.url}...`);
    const mobileRes = await runLighthouse(item.url, 'mobile');
    results.mobile.push({ name: item.name, ...mobileRes });

    console.log(`Auditing [Desktop] ${item.name}: ${item.url}...`);
    const desktopRes = await runLighthouse(item.url, 'desktop');
    results.desktop.push({ name: item.name, ...desktopRes });
  }

  fs.writeFileSync('lighthouse-baseline.json', JSON.stringify(results, null, 2));
  console.log('\n--- AUDIT COMPLETE ---');
  console.log(JSON.stringify(results, null, 2));
}

main();
