const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });

  while (true) {
    const page = await browser.newPage();

    await page.goto('https://pulse.glimmora.ai/login');

    await page.fill('input[type="email"]', 'your-email@example.com');
    await page.fill('input[type="password"]', 'your-password');

    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    await page.close();

    console.log('Login Attempt Completed');
  }
})();