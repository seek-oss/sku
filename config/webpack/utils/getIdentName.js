const path = require('path');
const loaderUtils = require('loader-utils');

// css-loader@3+ does not escape characters in selectors as expected.
// Since upgrading if the `[name]` local contains a `.` it is not replaced
// with a `-` as previously in v2. This causes an issue in development
// where we use the `[name]__[local]__[hash]` identName.
//
// A css module in a `.css.js` file will result in an invalid selector, eg:
// Input:
//   ## button.css.js
//   export default {
//     '.container': { /* css rules */ }
//   }
// Output v2: `button-css__container__<hash>`
// Output v3: `button.css__container__<hash>`
//
// Have raise issue with css-loader reverting to `getLocalIdent` behaviour
// from css-loader@2.1.1
// Issue: https://github.com/webpack-contrib/css-loader/issues/966#issuecomment-514874689
// Source: https://github.com/webpack-contrib/css-loader/blob/v2.1.1/src/utils.js#L68

function getLocalIdent(loaderContext, localIdentName, localName, options) {
  if (!options.context) {
    options.context = loaderContext.rootContext;
  }

  const request = path
    .relative(options.context, loaderContext.resourcePath)
    .replace(/\\/g, '/');

  options.content = `${options.hashPrefix + request}+${unescape(localName)}`;

  // eslint-disable-next-line no-param-reassign
  localIdentName = localIdentName.replace(/\[local\]/gi, localName);

  const hash = loaderUtils.interpolateName(
    loaderContext,
    localIdentName,
    options,
  );

  return hash
    .replace(new RegExp('[^a-zA-Z0-9\\-_\u00A0-\uFFFF]', 'g'), '-')
    .replace(/^((-?[0-9])|--)/, '_$1');
}

module.exports = getLocalIdent;
