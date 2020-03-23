# Multi site (Theming)

One of the features that makes sku unique, is it can handle a multi site/brand application out of the box using the [`sites`](./docs/configuration#sites) option.

## Switching site by host

By default, sku will render the first site in the [`sites`](./docs/configuration#sites) array when using `sku start`. However, if you want to be able to switch between sites without restarting the server, you can do so by setting a `host` for each site.

```js
module.exports = {
  sites: [
    { name: 'seekAnz', host: 'dev.seek.com.au' },
    { name: 'jobStreet', host: 'dev.jobstreet.com' },
  ],
};
```

Now, if you request `http://dev.seek.com.au`, you will receive the `seekAnz` version of the app, and `http://dev.jobstreet.com` will return the `jobStreet` one.

### Setup hosts

Switching site by host requires that the hosts are configured on your system to point to localhost. sku can do this for you.

First add the following script to your `package.json`.

```JSON
{
  "setup-hosts": "sku setup-hosts"
}
```

Then you can run the script to configure you machine with the required hosts.

```bash
$ sudo npm run setup-hosts
```

_**NOTE:** Modifying hosts configuration needs root privileges._

## Braid example

The following is an example of how you would use this feature with [Braid](https://github.com/seek-oss/braid-design-system), but you can use this approach to vary your sites in any way.

_**NOTE:** Currently this example is for static rendering projects only but SSR projects can follow the same pattern._

### Config

Firstly, add a [`sites`](./docs/configuration#sites) option to your `sku.config.js`. This tells sku to render a version of your app for each site you specify.

_**NOTE:** For this example to work, your sites need to match the available [themes in Braid](https://github.com/seek-oss/braid-design-system/tree/master/lib/themes), however, you could just as easily map the theme name from your site._

```js
module.exports = {
  sites: ['seekAnz', 'jobStreet'],
};
```

### Rendering the site

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
      </SkuProvider>,
    );
  },

  // Make the site variable available for the client
  provideClientContext: ({ site }) => ({
    site,
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
  `,
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

### Loading the theme

Now the site is available in our `App` component, we use `BraidLoadableProvider` (which uses [loadable-components](./docs/code-splitting) internally) to configure the specified theme.

```js
// App.js
import React from 'react';

import { BraidLoadableProvider } from 'braid-design-system';

export default ({ site }) => {
  return (
    <BraidLoadableProvider themeName={site}>
      <MyPage />
    </BraidLoadableProvider>
  );
};
```
