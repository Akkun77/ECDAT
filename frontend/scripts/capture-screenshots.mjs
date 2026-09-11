import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve('..', 'docs', 'screenshots');

async function captureHackathonScreenshots() {
  console.log('====================================================');
  console.log('   ECDAT CAPTURE 5 EXACT HACKATHON SCREENSHOTS');
  console.log(`   Output Directory: ${SCREENSHOT_DIR}`);
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  try {
    // ----------------------------------------------------------------------
    // 1. OVERVIEW / DASHBOARD (Trigger scan first, then screenshot)
    // ----------------------------------------------------------------------
    console.log('[1/5] Navigating to Overview and running scan...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // Click Primary Scan CTA button if scan is not completed yet
    const scanBtn = await page.$('button');
    if (scanBtn) {
      const btnText = await page.evaluate(el => el.textContent, scanBtn);
      if (btnText && (btnText.includes('Scan') || btnText.includes('Demo'))) {
        console.log(`Clicking button: "${btnText.trim()}"`);
        await scanBtn.click();
      }
    }

    // Wait for scan to complete and 50 findings to appear
    console.log('Waiting for scan results to populate...');
    await page.waitForSelector('.text-4xl', { timeout: 20000 });
    await new Promise(r => setTimeout(r, 2500));

    // Screenshot 1: Overview Dashboard
    const file1 = path.join(SCREENSHOT_DIR, '01_overview_dashboard.png');
    await page.screenshot({ path: file1, fullPage: false });
    console.log(`✅ Saved 1: ${file1}`);

    // ----------------------------------------------------------------------
    // 2. FINDINGS — RSA-2048 EXPANDED
    // ----------------------------------------------------------------------
    console.log('\n[2/5] Navigating to Findings and finding RSA-2048...');
    await page.click('a[href="/findings"]');
    await page.waitForSelector('h1', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));

    // Search for RSA
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 });
      await searchInput.type('RSA');
      await new Promise(r => setTimeout(r, 800));
    }

    // Expand the first RSA finding row
    const rsaRow = await page.$('.cursor-pointer');
    if (rsaRow) {
      await rsaRow.click();
      await new Promise(r => setTimeout(r, 1200));
    }

    const file2 = path.join(SCREENSHOT_DIR, '02_findings_rsa_expanded.png');
    await page.screenshot({ path: file2, fullPage: false });
    console.log(`✅ Saved 2: ${file2}`);

    // ----------------------------------------------------------------------
    // 3. FINDINGS — MD5 EXPANDED
    // ----------------------------------------------------------------------
    console.log('\n[3/5] Navigating and finding MD5 with Broken vs Not Applicable...');
    // Clear search input and search for MD5
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 500));

    const searchInput2 = await page.$('input[placeholder*="Search"]');
    if (searchInput2) {
      await searchInput2.type('MD5');
      await new Promise(r => setTimeout(r, 800));
    }

    // Expand first MD5 row
    const md5Row = await page.$('.cursor-pointer');
    if (md5Row) {
      await md5Row.click();
      await new Promise(r => setTimeout(r, 1200));
    }

    const file3 = path.join(SCREENSHOT_DIR, '03_findings_md5_expanded.png');
    await page.screenshot({ path: file3, fullPage: false });
    console.log(`✅ Saved 3: ${file3}`);

    // ----------------------------------------------------------------------
    // 4. CRYPTO MAP (Interactive Graph)
    // ----------------------------------------------------------------------
    console.log('\n[4/5] Navigating to Crypto Map...');
    await page.click('a[href="/crypto-map"]');
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2500));

    const file4 = path.join(SCREENSHOT_DIR, '04_crypto_map.png');
    await page.screenshot({ path: file4, fullPage: false });
    console.log(`✅ Saved 4: ${file4}`);

    // ----------------------------------------------------------------------
    // 5. MIGRATION PLAN (Act Now / Plan / Monitor / Mosca & PQC)
    // ----------------------------------------------------------------------
    console.log('\n[5/5] Navigating to Migration Plan...');
    await page.click('a[href="/migration"]');
    await page.waitForSelector('h1', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    const file5 = path.join(SCREENSHOT_DIR, '05_migration_plan.png');
    await page.screenshot({ path: file5, fullPage: false });
    console.log(`✅ Saved 5: ${file5}`);

    console.log('\n====================================================');
    console.log('   ALL 5 HACKATHON SCREENSHOTS CAPTURED SUCCESSFULLY');
    console.log('====================================================');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

captureHackathonScreenshots();
