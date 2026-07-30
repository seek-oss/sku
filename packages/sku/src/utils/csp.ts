import { createHash } from 'node:crypto';

export type ReportingEndpoint = { endpoint: string; url?: string };

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
