import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createContext();
  const page = await context.newPage();

  try {
    // Navigate to contract page
    await page.goto('http://localhost:5173/professional/sign-contract', {
      waitUntil: 'networkidle',
      timeout: 10000
    }).catch(() => {});

    // Wait a bit for page to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'contract-page-screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved to contract-page-screenshot.png');

    // Log the current URL to see if it redirected
    console.log('Current URL:', page.url());

    // Get page content to check what's rendered
    const content = await page.content();
    if (content.includes('Contrato de uso')) {
      console.log('✅ Contract page content found');
      console.log('✅ Contract title visible');
    } else if (content.includes('Iniciar sesión') || content.includes('Login')) {
      console.log('⚠️  Page redirected to login (expected - auth required)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
