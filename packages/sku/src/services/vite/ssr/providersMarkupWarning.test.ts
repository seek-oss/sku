import { describe, expect, it, vi } from 'vitest';

import {
  PROVIDERS_PROBE_SENTINEL,
  providersMarkupWarning,
  warnIfProbeRendersMarkup,
} from './providersMarkupWarning.js';

describe('warnIfProbeRendersMarkup', () => {
  it('stays silent for context-only providers', () => {
    const warn = vi.fn();

    warnIfProbeRendersMarkup({
      entryLabel: 'serverEntry',
      renderProbe: () => PROVIDERS_PROBE_SENTINEL,
      warn,
    });

    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when the probe renders hydration-relevant markup', () => {
    const warn = vi.fn();

    warnIfProbeRendersMarkup({
      entryLabel: 'clientEntry',
      renderProbe: () => `<div>${PROVIDERS_PROBE_SENTINEL}</div>`,
      warn,
    });

    expect(warn).toHaveBeenCalledWith(providersMarkupWarning('clientEntry'));
  });

  it('does not fail the render when the probe throws', () => {
    const warn = vi.fn();

    expect(() =>
      warnIfProbeRendersMarkup({
        entryLabel: 'serverEntry',
        renderProbe: () => {
          throw new Error('boom');
        },
        warn,
      }),
    ).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
  });
});
