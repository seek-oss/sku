import { type Browser, chromium } from 'playwright';
import debug from 'debug';

const log = debug('sku:browser');

let _browser: Promise<Browser> | null = null;

/**
 * Returns a browser instance. If a browser instance already exists, it will be returned.
 */
const getBrowser = async () => {
  if (_browser) {
    return _browser;
  }

  log('Launching browser');
  _browser = chromium.launch({
    // Slow down Playwright actions so the browser has time to hydrate the app
    slowMo: 50,
    headless: process.env.HEADLESS !== 'false',
  });

  return _browser;
};

/**
 * Closes the browser, along with all its contexts and pages.
 */
export const closeBrowser = async (): Promise<void> => {
  const browser = await _browser;
  if (!browser) {
    return;
  }
  log('Closing browser');
  await browser?.close();
  _browser = null;
};

const createContext = async () => {
  const browser = await getBrowser();

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  return context;
};

export const createPage = async () => {
  const context = await createContext();
  const page = await context.newPage();
  return page;
};
