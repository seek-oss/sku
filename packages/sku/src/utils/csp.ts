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
