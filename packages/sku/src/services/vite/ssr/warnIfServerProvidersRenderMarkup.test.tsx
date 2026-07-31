import { createContext } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { providersMarkupWarning } from './providersMarkupWarning.js';
import type { SkuSsrProviders } from './types.js';
import { warnIfServerProvidersRenderMarkup } from './warnIfServerProvidersRenderMarkup.js';

const props = { site: 'au', clientContext: { userId: 'user-1' } };
const SiteContext = createContext<string | null>(null);

describe('warnIfServerProvidersRenderMarkup', () => {
  it('stays silent for context-only providers', () => {
    const warn = vi.fn();
    const Providers: SkuSsrProviders = ({ children, site }) => (
      <SiteContext.Provider value={site}>{children}</SiteContext.Provider>
    );

    warnIfServerProvidersRenderMarkup(Providers, props, warn);

    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when providers render DOM', () => {
    const warn = vi.fn();
    const Providers: SkuSsrProviders = ({ children }) => (
      <div className="layout">{children}</div>
    );

    warnIfServerProvidersRenderMarkup(Providers, props, warn);

    expect(warn).toHaveBeenCalledWith(providersMarkupWarning('serverEntry'));
  });
});
