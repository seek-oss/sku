// This file also tests the double quotes.
import { loadable } from 'sku/vite/loadable';

const LoadableComponent = loadable(() => import('./MyComponent'));
