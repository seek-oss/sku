import { createHash, randomBytes } from 'node:crypto';
import {
  type CspExtraSources,
  type ReportingEndpoint,
  cspExtraSourceDirectives,
  stringifyReportingEndpoints,
} from '../../../utils/csp.js';

export const createCspNonce = () =>
  process.env.SKU_CSP_NONCE ?? randomBytes(16).toString('base64url');

const hashScript = (body: string) =>
  `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;

export const buildContentSecurityPolicy = ({
  inlineScripts,
  nonce,
  extraSources = {},
  development = false,
  reportTo,
}: {
  inlineScripts: string[];
  nonce?: string;
  extraSources?: CspExtraSources;
  development?: boolean;
  reportTo?: ReportingEndpoint;
}) => {
  // Relative publicPath only: Document assets are covered by `'self'`.
  // Include `'nonce-…'` only when a nonce was requested for this response.
  const directives = new Map<string, string[]>([
    ['default-src', ["'self'"]],
    [
      'script-src',
      [
        "'self'",
        ...(nonce ? [`'nonce-${nonce}'`] : []),
        ...inlineScripts.map(hashScript),
        ...(development ? ["'unsafe-eval'"] : []),
      ],
    ],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:']],
    ['font-src', ["'self'"]],
    ['connect-src', ["'self'", ...(development ? ['ws:', 'wss:'] : [])]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
  ]);

  for (const directive of cspExtraSourceDirectives) {
    const sources = extraSources[directive];
    if (sources?.length) {
      const ownSources = directives.get(directive) ?? ["'self'"];
      directives.set(directive, [...new Set([...ownSources, ...sources])]);
    }
  }

  const policy = Array.from(
    directives,
    ([directive, sources]) => `${directive} ${sources.join(' ')}`,
  );

  if (reportTo) {
    policy.push(`report-to ${reportTo.endpoint}`);
  }

  return policy.join('; ');
};

export const buildCspHeaders = ({
  enabled,
  reportOnlyEnabled,
  inlineScripts,
  nonce,
  extraSources,
  reportTo,
  reportOnlyExtraSources,
  reportOnlyReportTo,
  development,
}: {
  enabled: boolean;
  reportOnlyEnabled: boolean;
  inlineScripts: string[];
  nonce?: string;
  extraSources: CspExtraSources;
  reportTo?: ReportingEndpoint;
  reportOnlyExtraSources: CspExtraSources;
  reportOnlyReportTo?: ReportingEndpoint;
  development: boolean;
}) => {
  const headers: Record<string, string> = {};
  const reportingEndpoints: ReportingEndpoint[] = [];

  if (enabled) {
    headers['Content-Security-Policy'] = buildContentSecurityPolicy({
      inlineScripts,
      nonce,
      extraSources,
      development,
      reportTo,
    });

    if (reportTo?.url) {
      reportingEndpoints.push(reportTo);
    }
  }
  if (reportOnlyEnabled) {
    headers['Content-Security-Policy-Report-Only'] = buildContentSecurityPolicy(
      {
        inlineScripts,
        nonce,
        extraSources: reportOnlyExtraSources,
        development,
        reportTo: reportOnlyReportTo,
      },
    );

    if (reportOnlyReportTo?.url) {
      reportingEndpoints.push(reportOnlyReportTo);
    }
  }

  if (reportingEndpoints.length) {
    headers['Reporting-Endpoints'] =
      stringifyReportingEndpoints(reportingEndpoints);
  }

  return headers;
};
