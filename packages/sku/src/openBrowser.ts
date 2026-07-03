// Inspired by create-react-app
// https://github.com/facebook/create-react-app/commit/d2de54b25cc25800df1764058997e3e274bd79ac

import open from 'tiny-open';
import isCI from './utils/isCI.js';
import getDefaultBrowser from 'default-browser';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createDebug } from 'obug';
import { execAsync } from './utils/execAsync.js';
import { caution, strong } from '@sku-private/utils/console';

const log = createDebug('sku:openBrowser');

const BIN_DIR = resolve(fileURLToPath(import.meta.url), '../../bin');

const OSX_CHROME = 'google chrome';

const supportedChromiumBrowsers = [
  'Chrome',
  'Google Chrome',
  'Google Chrome Canary',
  'Edge',
  'Microsoft Edge',
  'Brave Browser',
  'Vivaldi',
  'Chromium',
  'Arc',
];

async function getBrowserPreference() {
  const envBrowser =
    process.env.BROWSER === OSX_CHROME
      ? 'Google Chrome'
      : (process.env.BROWSER ?? '');

  try {
    const { name } = await getDefaultBrowser();
    return name ?? envBrowser;
  } catch {
    console.log(strong(caution('Failed to detect default browser.')));
    console.log(
      caution(
        `For a better ${strong('start')} experience on macOS, go to ${strong(
          'System Preferences > Privacy & Security > Automation > Terminal/Application',
        )} and enable Finder permissions.`,
      ),
    );
    return envBrowser;
  }
}

export const openBrowser = async (url: string) => {
  if (process.env.OPEN_TAB === 'false' || isCI) {
    return;
  }

  const preferredBrowser = await getBrowserPreference();

  const shouldTryOpenChromiumWithAppleScript =
    process.platform === 'darwin' &&
    (!preferredBrowser || supportedChromiumBrowsers.includes(preferredBrowser));

  if (shouldTryOpenChromiumWithAppleScript) {
    try {
      const ps = await execAsync('ps cax');
      const openedBrowser =
        preferredBrowser && ps.includes(preferredBrowser)
          ? preferredBrowser
          : supportedChromiumBrowsers.find((b) => ps.includes(b));

      if (openedBrowser) {
        // Try our best to reuse existing tab with AppleScript
        await execAsync(
          `osascript openChrome.applescript "${encodeURI(
            url,
          )}" "${openedBrowser}"`,
          {
            cwd: BIN_DIR,
          },
        );
        return true;
      }
    } catch (error) {
      // Ignore errors and just log them
      log('Failed to open browser with AppleScript:', error);
    }
  }
  log('Opening in a new tab in the browser:', preferredBrowser);
  open(url);
};
