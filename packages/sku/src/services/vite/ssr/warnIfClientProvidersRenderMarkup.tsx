import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import {
  PROVIDERS_PROBE_SENTINEL,
  warnIfProbeRendersMarkup,
} from './providersMarkupWarning.js';
import type { SkuSsrProviders, SkuSsrProvidersProps } from './types.js';

/**
 * Development only — renders `Providers` into a detached root before hydration,
 * so context-only providers are exercised twice on a dev page load.
 */
export const warnIfClientProvidersRenderMarkup = (
  Providers: SkuSsrProviders,
  props: Omit<SkuSsrProvidersProps, 'children'>,
  warn?: (message: string) => void,
): void =>
  warnIfProbeRendersMarkup({
    entryLabel: 'clientEntry',
    renderProbe: () => {
      const container = document.createElement('div');
      const root = createRoot(container);
      flushSync(() => {
        root.render(
          <Providers {...props}>{PROVIDERS_PROBE_SENTINEL}</Providers>,
        );
      });
      const html = container.innerHTML;
      root.unmount();
      return html;
    },
    warn,
  });
