// Inspired by create-react-app
// https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/openBrowser.js

const execSync = require('node:child_process').execSync;
const open = require('open');

const isCI = require('../isCI');

const OSX_CHROME = 'google chrome';

module.exports = async (url) => {
  if (process.env.OPEN_TAB !== 'false' && !isCI) {
    const { default: getDefaultBrowser } = await import('default-browser');
    const { name: defaultBrowser } = await getDefaultBrowser();

    const availableBrowser = process.env.BROWSER;

    const shouldTryOpenChromiumWithAppleScript =
      process.platform === 'darwin' &&
      (typeof availableBrowser !== 'string' || availableBrowser === OSX_CHROME);

    if (shouldTryOpenChromiumWithAppleScript) {
      // Will use the first open browser found from list
      const supportedChromiumBrowsers = [
        defaultBrowser,
        'Google Chrome Canary',
        'Google Chrome',
        'Microsoft Edge',
        'Brave Browser',
        'Vivaldi',
        'Chromium',
        'Arc',
      ];

      const uniqueSupportedChromiumBrowsers = new Set(supportedChromiumBrowsers);

      for (const chromiumBrowser of uniqueSupportedChromiumBrowsers) {
        try {
          // Try our best to reuse existing tab
          // on OS X Google Chrome with AppleScript
          execSync(`ps cax | grep "${chromiumBrowser}"`);
          execSync(
            `osascript openChrome.applescript "${encodeURI(
              url,
            )}" "${chromiumBrowser}"`,
            {
              cwd: __dirname,
              stdio: 'ignore',
            },
          );
          return true;
        } catch (e) {
          // Ignore errors.
        }
      }
    }

    open(url, { url: true });
  }
};
