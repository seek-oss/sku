// Inspired by create-react-app
// https://github.com/facebook/create-react-app/commit/d2de54b25cc25800df1764058997e3e274bd79ac

const { yellow, italic } = require('chalk');
const execSync = require('node:child_process').execSync;
const open = require('open');

const isCI = require('../isCI');

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

module.exports = async (url) => {
  if (process.env.OPEN_TAB !== 'false' && !isCI) {
    const { default: getDefaultBrowser } = await import('default-browser');
    let defaultBrowser;
    try {
      const { name } = await getDefaultBrowser();
      defaultBrowser = name;
    } catch {
      console.log(yellow.bold('Failed to detect default browser.'));
      console.log(
        yellow(
          `For a better ${italic('start')} experience on macOS, go to ${italic(
            'System Preferences > Privacy & Security > Automation > Terminal/Application',
          )} and enable Finder permissions.`,
        ),
      );
    }

    const availableBrowser = process.env.BROWSER;

    const shouldTryOpenChromiumWithAppleScript =
      process.platform === 'darwin' &&
      (typeof availableBrowser !== 'string' ||
        availableBrowser === OSX_CHROME) &&
      supportedChromiumBrowsers.includes(defaultBrowser);

    if (shouldTryOpenChromiumWithAppleScript) {
      // Will use the first open browser found from list
      const supportedChromiumBrowsersByPreference = new Set([
        defaultBrowser,
        ...supportedChromiumBrowsers,
      ]);

      for (const chromiumBrowser of supportedChromiumBrowsersByPreference) {
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
        } catch {
          // Ignore errors.
        }
      }
    }

    open(url, { url: true });
  }
};
