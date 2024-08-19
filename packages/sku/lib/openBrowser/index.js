// Inspired by create-react-app
// https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/openBrowser.js

const execSync = require('node:child_process').execSync;
const open = require('open');

const isCI = require('../isCI');

const OSX_CHROME = 'google chrome';

module.exports = (url) => {
  if (process.env.OPEN_TAB !== 'false' && !isCI) {
    const browser = process.env.BROWSER;

    const shouldTryOpenChromiumWithAppleScript =
      process.platform === 'darwin' &&
      (typeof browser !== 'string' || browser === OSX_CHROME);

    if (shouldTryOpenChromiumWithAppleScript) {
      // Will use the first open browser found from list
      const supportedChromiumBrowsers = [
        'Google Chrome Canary',
        'Google Chrome',
        'Microsoft Edge',
        'Brave Browser',
        'Vivaldi',
        'Chromium',
      ];

      for (const chromiumBrowser of supportedChromiumBrowsers) {
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
