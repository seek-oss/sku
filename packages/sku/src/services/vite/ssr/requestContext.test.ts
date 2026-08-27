import { describe, expect, it, vi } from 'vitest';
import { buildContentSecurityPolicy, buildCspHeaders } from './csp.js';
import type { SsrRequestContextStore } from './requestContext.js';

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
    };

    expect(requestContext.getCspNonce()).toBeUndefined();
    // noop `run` ignores the store, so getters stay undefined (browser path).
    expect(
      requestContext.runWithSsrRequestContext(store, () =>
        requestContext.getCspNonce(),
      ),
    ).toBeUndefined();
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
      reportOnlyReportTo: { endpoint: 'csp-endpoint' },
      development: false,
    });

    expect(headers['Content-Security-Policy-Report-Only']).toContain(
      'report-to csp-endpoint',
    );
    expect(headers['Content-Security-Policy']).not.toContain('report-to');
  });

  it('includes report-to on the enforcing policy when configured', () => {
    const headers = buildCspHeaders({
      enabled: true,
      reportOnlyEnabled: false,
      inlineScripts: [],
      extraHosts: [],
      reportTo: { endpoint: 'csp-endpoint' },
      reportOnlyExtraHosts: [],
      development: false,
    });

    expect(headers['Content-Security-Policy']).toContain(
      'report-to csp-endpoint',
    );
  });

  it('omits report-to when unset', () => {
    const headers = buildCspHeaders({
      enabled: false,
      reportOnlyEnabled: true,
      inlineScripts: [],
      extraHosts: [],
      reportOnlyExtraHosts: [],
      reportOnlyReportTo: undefined,
      development: false,
    });

    expect(headers['Content-Security-Policy-Report-Only']).not.toContain(
      'report-to',
    );
  });
});

describe('buildCspHeaders Reporting-Endpoints', () => {
  it('emits a Reporting-Endpoints header for endpoints with a url', () => {
    const headers = buildCspHeaders({
      enabled: true,
      reportOnlyEnabled: true,
      inlineScripts: [],
      extraHosts: [],
      reportTo: { endpoint: 'csp-endpoint', url: 'https://example.com/csp' },
      reportOnlyExtraHosts: [],
      reportOnlyReportTo: {
        endpoint: 'csp-report-only-endpoint',
        url: 'https://example.com/csp-report-only',
      },
      development: false,
    });

    expect(headers['Reporting-Endpoints']).toBe(
      'csp-endpoint="https://example.com/csp", csp-report-only-endpoint="https://example.com/csp-report-only"',
    );
  });

  it('omits the Reporting-Endpoints header when no endpoint has a url', () => {
    const headers = buildCspHeaders({
      enabled: true,
      reportOnlyEnabled: true,
      inlineScripts: [],
      extraHosts: [],
      reportTo: { endpoint: 'csp-endpoint' },
      reportOnlyExtraHosts: [],
      reportOnlyReportTo: { endpoint: 'csp-endpoint' },
      development: false,
    });

    expect(headers['Reporting-Endpoints']).toBeUndefined();
  });
});
