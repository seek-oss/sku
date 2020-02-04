// This is provided so consumers can import `sku/playroom`,
// since they don't depend on `playroom` directly.

// We can't re-export directly because eslint-plugin-import doesn't understand :(

import { createUrl, Snippets } from 'playroom';

export { createUrl, Snippets };
