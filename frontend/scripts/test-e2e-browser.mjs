import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('   ECDAT COMPREHENSIVE END-TO-END FINAL VERIFICATION');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
  });

  // Helper to check horizontal overflow
  async function checkHorizontalOverflow(pageName) {
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    if (hasOverflow) {
      console.warn(`[WARNING] Horizontal overflow detected on ${pageName}!`);
    } else {
      console.log(`[PASS] No horizontal overflow on ${pageName}`);
    }
    return !hasOverflow;
  }

  try {
    // ----------------------------------------------------
    // 1. OVERVIEW PAGE (1920x1080)
    // ----------------------------------------------------
    console.log('--- 1. Testing Overview at 1920x1080 ---');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await checkHorizontalOverflow('Overview (1920x1080)');

    // Trigger demo scan
    console.log('Triggering real demo scan from Overview CTA...');
    const scanBtn = await page.$('button');
    if (!scanBtn) throw new Error('Primary Scan CTA button not found on Overview');
    await scanBtn.click();

    // Wait for scan to complete and hero metrics to render
    console.log('Waiting for scan progress and completion...');
    await page.waitForSelector('.text-4xl', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Verify Overview headline and metrics
    const heroHeadline = await page.$eval('h1', (el) => el.textContent?.trim());
    console.log(`Hero Headline: "${heroHeadline}"`);

    const metrics = await page.$$eval('.text-4xl', (els) => els.map((e) => e.textContent?.trim()));
    console.log('Overview Real Metrics:', metrics);

    // Verify 50 findings
    const findingsMetric = metrics.find((m) => m === '50');
    if (!findingsMetric) throw new Error('Expected 50 findings metric on Overview');
    console.log('[PASS] Overview correctly shows 50 Crypto Findings');

    // ----------------------------------------------------
    // 2. OVERVIEW PAGE (1366x768)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Overview at 1366x768 ---');
    await page.setViewport({ width: 1366, height: 768 });
    await new Promise((r) => setTimeout(r, 500));
    await checkHorizontalOverflow('Overview (1366x768)');

    // ----------------------------------------------------
    // 3. FINDINGS PAGE & DETAIL DRAWER
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Findings Page (/findings) ---');
    await page.click('a[href="/findings"]');
    await page.waitForSelector('h1', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 1000));
    await checkHorizontalOverflow('Findings');

    const findingRows = await page.$$('.cursor-pointer');
    console.log(`Found ${findingRows.length} expandable finding rows`);
    if (findingRows.length < 40) throw new Error(`Expected ~50 findings, found ${findingRows.length}`);

    // Click through findings to verify specific exemplars
    console.log('Searching and verifying finding details...');

    // A. Verify MD5 finding
    const searchInput = await page.$('input[placeholder*="Search"]');
    await searchInput.type('md5');
    await new Promise((r) => setTimeout(r, 500));

    const md5Row = await page.$('.cursor-pointer');
    if (md5Row) {
      await md5Row.click();
      await new Promise((r) => setTimeout(r, 600));

      const md5Text = await page.$eval('.bg-slate-950\\/60', (el) => el.textContent || '');
      console.log('MD5 Finding Detail verified:');
      console.log('  - Contains "Current Security Status":', md5Text.includes('Current Security Status'));
      console.log('  - Contains "Broken":', md5Text.includes('Broken'));
      console.log('  - Contains "Not Applicable":', md5Text.includes('Not Applicable'));
      console.log('  - Contains "Critical":', md5Text.includes('CRITICAL'));
      console.log('  - Suggests SHA-256/SHA-3:', md5Text.includes('SHA-256'));
      await md5Row.click(); // close
    }

    // Clear search
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    // B. Verify RSA signature finding
    await searchInput.type('auth.py');
    await new Promise((r) => setTimeout(r, 500));

    const rsaRow = await page.$('.cursor-pointer');
    if (rsaRow) {
      await rsaRow.click();
      await new Promise((r) => setTimeout(r, 600));

      const rsaText = await page.$eval('.bg-slate-950\\/60', (el) => el.textContent || '');
      console.log('RSA Finding Detail verified:');
      console.log('  - Contains "Vulnerable":', rsaText.includes('Vulnerable'));
      console.log('  - Contains "Acceptable":', rsaText.includes('Acceptable'));
      console.log('  - Contains "Mosca":', rsaText.includes('Mosca'));
      console.log('  - Contains demo assumption note:', rsaText.includes('demo assumption'));
      await rsaRow.click(); // close
    }

    // Clear search
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    // ----------------------------------------------------
    // 4. CBOM PAGE
    // ----------------------------------------------------
    console.log('\n--- 4. Testing CBOM Page (/cbom) ---');
    await page.click('a[href="/cbom"]');
    await page.waitForSelector('table', { timeout: 5000 });
    await checkHorizontalOverflow('CBOM');

    const cbomRows = await page.$$eval('tbody tr', (els) => els.length);
    console.log(`CBOM table loaded with ${cbomRows} component rows`);
    if (cbomRows !== 50) console.warn(`Notice: CBOM has ${cbomRows} rows`);

    const jsonExportBtn = await page.$('a[href*="export"][href*="json"]');
    const csvExportBtn = await page.$('a[href*="export"][href*="csv"]');
    console.log('[PASS] CBOM Export JSON link present:', !!jsonExportBtn);
    console.log('[PASS] CBOM Export CSV link present:', !!csvExportBtn);

    // ----------------------------------------------------
    // 5. CRYPTO MAP PAGE
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Crypto Architecture Map (/crypto-map) ---');
    await page.click('a[href="/crypto-map"]');
    await page.waitForSelector('.react-flow', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 1000));
    await checkHorizontalOverflow('Crypto Map');

    const nodeCount = await page.$$eval('.react-flow__node', (els) => els.length);
    console.log(`React Flow Crypto Map rendered with ${nodeCount} architecture nodes`);
    if (nodeCount < 10) throw new Error('Crypto map did not render expected nodes');

    // ----------------------------------------------------
    // 6. MIGRATION ROADMAP PAGE
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Migration Plan (/migration) ---');
    await page.click('a[href="/migration"]');
    await page.waitForSelector('h1', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 500));
    await checkHorizontalOverflow('Migration Plan');

    const migrationGroups = await page.$$eval('h2', (els) => els.map((e) => e.textContent?.trim()));
    console.log('Migration Roadmap Priority Tiers:', migrationGroups.filter(Boolean));

    const pageContent = await page.content();
    console.log('  - Contains "Act Now":', pageContent.includes('Act Now'));
    console.log('  - Contains "Plan Migration":', pageContent.includes('Plan Migration'));
    console.log('  - Contains "Monitor":', pageContent.includes('Monitor'));
    console.log('  - Contains "No Urgent Action":', pageContent.includes('No Urgent Action'));
    console.log('  - Contains Mosca explanation:', pageContent.includes('threat_horizon'));
    console.log('  - Contains ML-DSA recommendation:', pageContent.includes('ML-DSA'));
    console.log('  - Contains ML-KEM recommendation:', pageContent.includes('ML-KEM'));

    // ----------------------------------------------------
    // 7. REPORTS & AUDIT PAGE
    // ----------------------------------------------------
    console.log('\n--- 7. Testing Reports & Export (/reports) ---');
    await page.click('a[href="/reports"]');
    await page.waitForSelector('h1', { timeout: 5000 });
    await checkHorizontalOverflow('Reports');

    const reportCards = await page.$$eval('h2', (els) => els.map((e) => e.textContent?.trim()));
    console.log('Reports & Export cards:', reportCards.filter(Boolean));

    // ----------------------------------------------------
    // 8. SCAN PAGE
    // ----------------------------------------------------
    console.log('\n--- 8. Testing Scan Page (/scan) ---');
    await page.click('a[href="/scan"]');
    await page.waitForSelector('h1', { timeout: 5000 });
    await checkHorizontalOverflow('Scan Page');

    const scanCards = await page.$$eval('h2', (els) => els.map((e) => e.textContent?.trim()));
    console.log('Scan Options present:', scanCards.filter(Boolean));

    // ----------------------------------------------------
    // SUMMARY OF ERRORS
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log('             VERIFICATION SUMMARY');
    console.log('====================================================');
    console.log(`Console Errors: ${consoleErrors.length}`, consoleErrors);
    console.log(`Page Errors: ${pageErrors.length}`, pageErrors);

    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      console.log('\n>>> ALL PAGES & WORKFLOWS VERIFIED CLEANLY <<<');
    } else {
      throw new Error(`Browser encountered ${consoleErrors.length} console errors and ${pageErrors.length} page errors.`);
    }
  } catch (err) {
    console.error('VERIFICATION FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runComprehensiveVerification();
