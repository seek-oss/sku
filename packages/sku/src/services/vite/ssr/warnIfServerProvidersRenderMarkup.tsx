import { renderToStaticMarkup } from 'react-dom/server';

import {
  PROVIDERS_PROBE_SENTINEL,
  warnIfProbeRendersMarkup,
} from './providersMarkupWarning.js';
import type { SkuSsrProviders, SkuSsrProvidersProps } from './types.js';

/** Development only — callers probe once per process, not per request. */
export const warnIfServerProvidersRenderMarkup = (
  Providers: SkuSsrProviders,
  props: Omit<SkuSsrProvidersProps, 'children'>,
  warn?: (message: string) => void,
): void =>
  warnIfProbeRendersMarkup({
    entryLabel: 'serverEntry',
    renderProbe: () =>
      renderToStaticMarkup(
        <Providers {...props}>{PROVIDERS_PROBE_SENTINEL}</Providers>,
      ),
    warn,
  });
