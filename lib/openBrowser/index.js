// Inspired by create-react-app
// https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/openBrowser.js

const execSync = require('child_process').execSync;
const defaultBrowser = require('x-default-browser');
const open = require('open');

module.exports = url => {
  if (process.env.OPEN_TAB !== 'false') {
    defaultBrowser((err, res) => {
      const useChrome = err ? false : res.isChrome;

      if (process.platform === 'darwin' && useChrome) {
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

      open(url);
    });
  }
};
