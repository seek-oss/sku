import { loadable } from 'sku/vite/loadable';

const LoadableComponent = loadable(() => import('./MyComponent'));
