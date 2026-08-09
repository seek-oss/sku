import type { SkuMiddleware } from 'sku/runtime';

import { configMiddleware } from './config.js';

export const middleware: SkuMiddleware = [configMiddleware];
