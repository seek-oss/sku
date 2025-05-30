import { loadable as customLoadable } from 'sku/vite/loadable';

const LoadableComponent = customLoadable(() => import('./MyComponent'));
