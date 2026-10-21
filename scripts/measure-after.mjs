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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runLighthouseOnce(url, preset = 'mobile') {
  const tmpFile = path.resolve(`temp-lh-after-${preset}-${Date.now()}.json`);
  const formFactorFlag = preset === 'desktop' ? '--preset=desktop' : '--form-factor=mobile --screenEmulation.mobile=true';
  const cmd = `node ./node_modules/lighthouse/cli/index.js "${url}" --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" ${formFactorFlag} --output=json --only-categories=performance --quiet --output-path="${tmpFile}"`;

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
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    throw err;
  }
}

async function runLighthouseWithRetry(url, preset = 'mobile') {
  try {
    return await runLighthouseOnce(url, preset);
  } catch (e1) {
    console.warn(`Retry 1 for ${url} (${preset}) after 4s pause... Error: ${e1.message}`);
    await sleep(4000);
    try {
      return await runLighthouseOnce(url, preset);
    } catch (e2) {
      console.error(`Final failure for ${url} (${preset}):`, e2.message);
      return null;
    }
  }
}

async function main() {
  console.log('--- STARTING LIGHTHOUSE AUDIT FOR "AFTER" BENCHMARKS ---');
  for (const item of URLS) {
    console.log(`Auditing [Mobile] ${item.name}: ${item.url}...`);
    const mobileRes = await runLighthouseWithRetry(item.url, 'mobile');
    results.mobile.push({ name: item.name, ...mobileRes });
    await sleep(3000);

    console.log(`Auditing [Desktop] ${item.name}: ${item.url}...`);
    const desktopRes = await runLighthouseWithRetry(item.url, 'desktop');
    results.desktop.push({ name: item.name, ...desktopRes });
    await sleep(3000);
  }

  fs.writeFileSync('lighthouse-after.json', JSON.stringify(results, null, 2));
  console.log('\n--- AFTER AUDIT COMPLETE ---');
  console.log(JSON.stringify(results, null, 2));
}

main();
