# Multi site (Theming)

One of the features that makes sku unique, is it can handle a mutli site/brand application out of the box.
The following is an example of how you would use this feature with [Braid](https://github.com/seek-oss/braid-design-system), but you can use this approach to different your sites in anyway you see fit.

_**NOTE:** Currently this example is for static rendering projects only but SSR projects can follow the same pattern._

## Config

Firstly, add a [`sites`](./docs/configuration#sites) option to your `sku.config.js`. This tells sku to render a version of your app for each site you specify.

```js
module.exports = {
  sites: ['seekAnz', 'jobStreet']
};
```

## Forwarding site

Now handle the site variable in our render and client entries.

```js
// render.js
import React from 'react';
import { renderToString } from 'react-dom/server';

import App from './App';

export default {
  // Pass the site variable to your top level component
  renderApp: ({ site, SkuProvider }) => {
    return renderToString(
      <SkuProvider>
        <App site={site} />
      </SkuProvider>
    );
  },

  // Make the site variable available for the client
  provideClientContext: ({ site }) => ({
    site
  }),

  renderDocument: ({ app, headTags, bodyTags }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `
};
```

```js
// client.js
import React from 'react';
import { hydrate } from 'react-dom';

import App from './App';

// Pass the site variable from `provideClientContext` to the top level component
export default ({ site }) =>
  hydrate(<App site={site} />, document.getElementById('app'));
```

```js
// App.js
import React from 'react';
import loadable from '@loadable/component';

import { ThemeProvider } from 'braid-design-system';

// Create a loadable library which will differ by site for your Theme
const Theme = loadable.lib(({ site }) => import(`./themes/${site}`));

export default ({ site }) => (
  <Theme themeName={site}>
    {({ default: theme }) => ( {/* Note that the value is named 'default' as it is an export */}
      <ThemeProvider theme={theme}>
        <MyPage />
      </ThemeProvider>
    )}
  </Theme>
);
```
