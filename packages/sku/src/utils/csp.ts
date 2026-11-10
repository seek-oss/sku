import { createHash } from 'node:crypto';

export type ReportingEndpoint = { endpoint: string; url?: string };

export const cspExtraSourceDirectives = [
  'script-src',
  'style-src',
  'img-src',
  'font-src',
  'connect-src',
  'frame-src',
  'media-src',
  'worker-src',
  'manifest-src',
  'form-action',
] as const;

export type CspExtraSourceDirective = (typeof cspExtraSourceDirectives)[number];

export type CspExtraSources = Partial<
  Record<CspExtraSourceDirective, string[]>
>;

export const isCspExtraSourceDirective = (
  directive: string,
): directive is CspExtraSourceDirective =>
  (cspExtraSourceDirectives as readonly string[]).includes(directive);

export interface CspPolicyConfig {
  /**
   * Extra sources to append to directives of the policy, keyed by directive name.
   *
   * @example
   * { 'connect-src': ['https://browser-intake-datadoghq.com'] }
   */
  extraSources?: CspExtraSources;
  /**
   * Absolute `http:` or `https:` URL that the browser sends violation reports to.
   */
  reportTo?: string;
}

export interface CspConfig {
  /**
   * The `Content-Security-Policy` header. `true` enables sku's policy with nothing extra.
   */
  enforced?: true | CspPolicyConfig;
  /**
   * The `Content-Security-Policy-Report-Only` header. `true` enables sku's policy with nothing extra.
   */
  reportOnly?: true | CspPolicyConfig;
}

export const cspPolicyNames = ['enforced', 'reportOnly'] as const;

export const cspEndpointNames = {
  enforced: 'csp',
  reportOnly: 'csp-report-only',
} as const;

const resolveCspPolicy = (
  policy: true | CspPolicyConfig | undefined,
  endpoint: string,
) => {
  const { extraSources = {}, reportTo } = policy === true ? {} : (policy ?? {});

  return {
    enabled: Boolean(policy),
    extraSources,
    reportTo: reportTo ? { endpoint, url: reportTo } : undefined,
  };
};

export const resolveCspConfig = (csp: CspConfig = {}) => ({
  enforced: resolveCspPolicy(csp.enforced, cspEndpointNames.enforced),
  reportOnly: resolveCspPolicy(csp.reportOnly, cspEndpointNames.reportOnly),
});

export const parseCspReportTo = (
  cspReportTo: string | [string, string] | undefined,
): ReportingEndpoint | undefined => {
  if (cspReportTo === undefined) {
    return undefined;
  }

  if (Array.isArray(cspReportTo)) {
    const [endpoint, url] = cspReportTo;

    return { endpoint, url };
  }

  if (URL.canParse(cspReportTo)) {
    const hash = createHash('sha256').update(cspReportTo).digest('hex');

    return { endpoint: `endpoint-${hash.slice(0, 8)}`, url: cspReportTo };
  }

  return { endpoint: cspReportTo };
};

export const stringifyReportingEndpoints = (
  reportingEndpoints: ReportingEndpoint[],
): string =>
  Array.from(
    new Set(
      reportingEndpoints.map(
        ({ endpoint, url }) => `${endpoint}="${url ?? ''}"`,
      ),
    ),
  ).join(', ');
