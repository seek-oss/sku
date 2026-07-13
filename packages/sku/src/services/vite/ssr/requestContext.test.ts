import { describe, expect, it, vi } from 'vitest';
import { buildContentSecurityPolicy, buildCspHeaders } from './csp.js';
import { createSsrRequestContextStore } from './createSsrRequestContextStore.js';
import {
  getCspNonce,
  getSkuLanguage,
  peekCspNonce,
  runWithSsrRequestContext,
  type SsrRequestContextStore,
} from './requestContext.js';

describe('getCspNonce browser safety', () => {
  it('does not pull node:async_hooks into the shared requestContext module', async () => {
    vi.resetModules();
    vi.doMock('node:async_hooks', () => {
      throw new Error('node:async_hooks must not load with requestContext');
    });

    await expect(import('./requestContext.js')).resolves.toBeTruthy();

    vi.doUnmock('node:async_hooks');
  });

  it('returns undefined without installed storage', async () => {
    vi.resetModules();
    vi.doUnmock('node:async_hooks');

    const requestContext = await import('./requestContext.js');
    const store: SsrRequestContextStore = {
      getCspNonce: () => 'test-nonce',
      peekCspNonce: () => 'test-nonce',
      getLanguage: () => undefined,
      setLanguage: () => undefined,
    };

    expect(requestContext.getCspNonce()).toBeUndefined();
    expect(requestContext.getSkuLanguage()).toBeUndefined();
    // noop `run` ignores the store, so getters stay undefined (browser path).
    expect(
      requestContext.runWithSsrRequestContext(store, () =>
        requestContext.getCspNonce(),
      ),
    ).toBeUndefined();
  });

  it('propagates nonce via AsyncLocalStorage when installed', async () => {
    vi.resetModules();
    vi.doUnmock('node:async_hooks');

    await import('./installSsrRequestContextStorage.js');
    const requestContext = await import('./requestContext.js');
    const { createSsrRequestContextStore: createStore } =
      await import('./createSsrRequestContextStore.js');

    expect(
      requestContext.runWithSsrRequestContext(createStore('server-nonce'), () =>
        requestContext.getCspNonce(),
      ),
    ).toBe('server-nonce');
    expect(requestContext.getCspNonce()).toBeUndefined();
  });

  it('does not pull node:crypto into the shared requestContext module', async () => {
    vi.resetModules();
    vi.doMock('node:crypto', () => {
      throw new Error('node:crypto must not load with requestContext');
    });

    await expect(import('./requestContext.js')).resolves.toBeTruthy();

    vi.doUnmock('node:crypto');
  });
});

describe('lazy request-scoped CSP nonce', () => {
  it('does not mint until requested', () => {
    const store = createSsrRequestContextStore();
    expect(store.peekCspNonce()).toBeUndefined();
    expect(
      runWithSsrRequestContext(store, () => peekCspNonce()),
    ).toBeUndefined();
  });

  it('mints once and reuses the same value', () => {
    const store = createSsrRequestContextStore();
    const first = runWithSsrRequestContext(store, () => getCspNonce());
    const second = runWithSsrRequestContext(store, () => getCspNonce());
    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(store.peekCspNonce()).toBe(first);
  });
});

describe('request language slot', () => {
  it('reads the language set on the request context store', () => {
    const store = createSsrRequestContextStore();
    store.setLanguage('th-TH');
    expect(runWithSsrRequestContext(store, () => getSkuLanguage())).toBe(
      'th-TH',
    );
    expect(getSkuLanguage()).toBeUndefined();
  });
});

describe('buildCspHeaders nonce inclusion', () => {
  it('omits nonce from CSP when never requested', () => {
    const headers = buildCspHeaders({
      enabled: true,
      reportOnlyEnabled: false,
      inlineScripts: ['console.log(1)'],
      extraHosts: [],
      reportOnlyExtraHosts: [],
      development: false,
    });

    expect(headers['Content-Security-Policy']).toBeTruthy();
    expect(headers['Content-Security-Policy']).not.toMatch(/'nonce-/);
  });

  it('includes nonce in CSP only after one was requested', () => {
    const policyWithout = buildContentSecurityPolicy({
      inlineScripts: [],
    });
    const policyWith = buildContentSecurityPolicy({
      inlineScripts: [],
      nonce: 'abc123',
    });

    expect(policyWithout).not.toMatch(/'nonce-/);
    expect(policyWith).toContain("'nonce-abc123'");
  });
});

describe('buildCspHeaders report-to', () => {
  it('includes report-to on Report-Only only when configured', () => {
    const headers = buildCspHeaders({
      enabled: true,
      reportOnlyEnabled: true,
      inlineScripts: [],
      extraHosts: [],
      reportOnlyExtraHosts: [],
      reportOnlyReportTo: 'csp-endpoint',
      development: false,
    });

    expect(headers['Content-Security-Policy-Report-Only']).toContain(
      'report-to csp-endpoint',
    );
    expect(headers['Content-Security-Policy']).not.toContain('report-to');
  });

  it('omits report-to when unset or empty', () => {
    for (const reportOnlyReportTo of [undefined, '']) {
      const headers = buildCspHeaders({
        enabled: false,
        reportOnlyEnabled: true,
        inlineScripts: [],
        extraHosts: [],
        reportOnlyExtraHosts: [],
        reportOnlyReportTo,
        development: false,
      });

      expect(headers['Content-Security-Policy-Report-Only']).not.toContain(
        'report-to',
      );
    }
  });
});
