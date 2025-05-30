import { loadable as customLoadable } from '@sku-lib/vite/loadable';

const LoadableComponent = customLoadable(() => import('./MyComponent'));
