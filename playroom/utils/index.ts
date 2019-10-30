// This is provided so consumers can import `sku/playroom/utils`,
// since they don't depend on `playroom` directly.

// We can't re-export directly because eslint-plugin-import doesn't understand :(

import { createUrl } from 'playroom/utils';

export { createUrl };
