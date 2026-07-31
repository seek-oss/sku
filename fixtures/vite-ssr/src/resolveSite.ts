import type { SkuSsrOnRequest } from 'sku';

import type { FixtureSite } from './routes.js';

type ExpressRequest = Parameters<SkuSsrOnRequest>[0]['req'];

/**
 * App-owned site resolution (not sku config hosts).
 * Prefer an explicit header so Host / config `sites[].host` alone cannot select.
 */
export function resolveSiteFromRequest(req: ExpressRequest): FixtureSite {
  const header = req.get('x-sku-site');
  if (header === 'nz' || header === 'au') {
    return header;
  }
  return 'au';
}
