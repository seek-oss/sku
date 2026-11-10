import { describe, it, expect } from 'vitest';
import { buildContentSecurityPolicy, buildCspHeaders } from './csp.js';

const getDirective = (policy: string, directive: string) =>
  policy.split('; ').find((entry) => entry.startsWith(`${directive} `));

describe('buildContentSecurityPolicy extra sources', () => {
  it('leaves the policy unchanged when no extra sources are configured', () => {
    expect(
      buildContentSecurityPolicy({ inlineScripts: [], extraSources: {} }),
    ).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
  });

  it('appends extra connect-src sources after sku’s own sources', () => {
    const extraSources = {
      'connect-src': ['https://browser-intake-datadoghq.com'],
    };

    expect(
      getDirective(
        buildContentSecurityPolicy({ inlineScripts: [], extraSources }),
        'connect-src',
      ),
    ).toBe("connect-src 'self' https://browser-intake-datadoghq.com");

    expect(
      getDirective(
        buildContentSecurityPolicy({
          inlineScripts: [],
          extraSources,
          development: true,
        }),
        'connect-src',
      ),
    ).toBe("connect-src 'self' ws: wss: https://browser-intake-datadoghq.com");
  });

  it('keeps the nonce and hashes when extending script-src', () => {
    const scriptSrc = getDirective(
      buildContentSecurityPolicy({
        inlineScripts: ['console.log(1)'],
        nonce: 'abc123',
        extraSources: { 'script-src': ['https://cdn.example.com'] },
      }),
      'script-src',
    );

    expect(scriptSrc).toMatch(
      /^script-src 'self' 'nonce-abc123' 'sha256-[^']+' https:\/\/cdn\.example\.com$/,
    );
  });

  it("emits a directive sku doesn't emit by default as 'self' plus the extras", () => {
    const policy = buildContentSecurityPolicy({
      inlineScripts: [],
      extraSources: { 'frame-src': ['https://www.youtube.com'] },
    });

    expect(getDirective(policy, 'frame-src')).toBe(
      "frame-src 'self' https://www.youtube.com",
    );
  });

  it('does not duplicate sources sku already emits', () => {
    const policy = buildContentSecurityPolicy({
      inlineScripts: [],
      extraSources: { 'img-src': ['data:', 'https://images.example.com'] },
    });

    expect(getDirective(policy, 'img-src')).toBe(
      "img-src 'self' data: https://images.example.com",
    );
  });

  it('ignores directives with no extra sources', () => {
    const policy = buildContentSecurityPolicy({
      inlineScripts: [],
      extraSources: { 'frame-src': [] },
    });

    expect(getDirective(policy, 'frame-src')).toBeUndefined();
  });

  it('keeps report-to as the last directive', () => {
    const policy = buildContentSecurityPolicy({
      inlineScripts: [],
      extraSources: { 'media-src': ['https://media.example.com'] },
      reportTo: { endpoint: 'csp-endpoint' },
    });

    expect(policy).toMatch(
      /media-src 'self' https:\/\/media\.example\.com; report-to csp-endpoint$/,
    );
  });
});

describe('buildCspHeaders extra sources', () => {
  it('uses separate extra sources for the enforcing and Report-Only policies', () => {
    const headers = buildCspHeaders({
      enabled: true,
      reportOnlyEnabled: true,
      inlineScripts: [],
      extraSources: { 'connect-src': ['https://enforced.example.com'] },
      reportOnlyExtraSources: {
        'connect-src': ['https://report-only.example.com'],
      },
      development: false,
    });

    expect(
      getDirective(headers['Content-Security-Policy'], 'connect-src'),
    ).toBe("connect-src 'self' https://enforced.example.com");
    expect(
      getDirective(
        headers['Content-Security-Policy-Report-Only'],
        'connect-src',
      ),
    ).toBe("connect-src 'self' https://report-only.example.com");
  });
});
