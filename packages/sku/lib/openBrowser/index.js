// Inspired by create-react-app
// https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/openBrowser.js

const execSync = require('node:child_process').execSync;
const open = require('open');

const isCI = require('../isCI');

const OSX_CHROME = 'google chrome';

module.exports = (url) => {
  if (process.env.OPEN_TAB !== 'false' && !isCI) {
    const browser = process.env.BROWSER;

    const shouldTryOpenChromeWithAppleScript =
      process.platform === 'darwin' &&
      (typeof browser !== 'string' || browser === OSX_CHROME);

    if (shouldTryOpenChromeWithAppleScript) {
      try {
        // Try our best to reuse existing tab
        // on OS X Google Chrome with AppleScript
        execSync('ps cax | grep "Google Chrome"');
        execSync(`osascript openChrome.applescript "${encodeURI(url)}"`, {
          cwd: __dirname,
          stdio: 'ignore',
        });
        return;
      } catch (e) {
        // Ignore errors.
      }
    }

    open(url, { url: true });
  }
};
