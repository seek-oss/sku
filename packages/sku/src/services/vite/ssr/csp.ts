import { createHash, randomBytes } from 'node:crypto';

export const createCspNonce = () =>
  process.env.SKU_CSP_NONCE ?? randomBytes(16).toString('base64url');

const hashScript = (body: string) =>
  `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;

export const buildContentSecurityPolicy = ({
  inlineScripts,
  nonce,
  extraHosts = [],
  development = false,
  reportTo,
}: {
  inlineScripts: string[];
  nonce?: string;
  extraHosts?: string[];
  development?: boolean;
  reportTo?: string;
}) => {
  // Relative publicPath only: Document assets are covered by `'self'`.
  // Third-party scripts use `extraHosts` (`cspExtraScriptSrcHosts`).
  // Include `'nonce-…'` only when a nonce was requested for this response.
  const scriptSrc = [
    "'self'",
    ...(nonce ? [`'nonce-${nonce}'`] : []),
    ...inlineScripts.map(hashScript),
    ...extraHosts,
    ...(development ? ["'unsafe-eval'"] : []),
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${development ? ' ws: wss:' : ''}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (reportTo) {
    directives.push(`report-to ${reportTo}`);
  }

  return directives.join('; ');
};

export const buildCspHeaders = ({
  enabled,
  reportOnlyEnabled,
  inlineScripts,
  nonce,
  extraHosts,
  reportOnlyExtraHosts,
  reportOnlyReportTo,
  development,
}: {
  enabled: boolean;
  reportOnlyEnabled: boolean;
  inlineScripts: string[];
  nonce?: string;
  extraHosts: string[];
  reportOnlyExtraHosts: string[];
  reportOnlyReportTo?: string;
  development: boolean;
}) => {
  const headers: Record<string, string> = {};

  if (enabled) {
    headers['Content-Security-Policy'] = buildContentSecurityPolicy({
      inlineScripts,
      nonce,
      extraHosts,
      development,
    });
  }
  if (reportOnlyEnabled) {
    headers['Content-Security-Policy-Report-Only'] = buildContentSecurityPolicy(
      {
        inlineScripts,
        nonce,
        extraHosts: reportOnlyExtraHosts,
        development,
        reportTo: reportOnlyReportTo || undefined,
      },
    );
  }

  return headers;
};
