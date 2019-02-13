// '__sku_alias__clientEntry' is a webpack alias
// pointing to the consuming apps client entry
import client from '__sku_alias__clientEntry';

import { loadableReady } from '../../@loadable/component';

import clientContextKey from '../clientContextKey';

loadableReady(() => {
  let clientContext = {};

  if (window[clientContextKey]) {
    clientContext = window[clientContextKey];
    delete window[clientContextKey];
  }

  client(clientContext);
});
