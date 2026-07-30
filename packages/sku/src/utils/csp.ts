export type ReportingEndpoint = { endpoint: string; url?: string };

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
