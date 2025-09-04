// This file also tests the double quotes.
import { loadable } from '@sku-lib/vite/loadable';

const LoadableComponent = loadable(() => import('./MyComponent'));
