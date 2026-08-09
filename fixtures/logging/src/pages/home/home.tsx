import { useLoaderData } from 'react-router';

import { injectCurrentTraceHeaders } from '../../shared/tracing.js';

const apiOrigin = (): string =>
  typeof window === 'undefined'
    ? `http://127.0.0.1:${process.env.PORT ?? '8212'}`
    : '';

export async function loader() {
  const headers: Record<string, string> = {};
  injectCurrentTraceHeaders(headers);

  const response = await fetch(`${apiOrigin()}/api/work`, { headers });
  if (!response.ok) {
    throw new Error(`api/work failed: ${response.status}`);
  }

  const body = (await response.json()) as { ok: boolean; work: string };
  return { work: body.work };
}

export function Component() {
  const { work } = useLoaderData<typeof loader>();

  return (
    <main data-testid="home-page">
      <h1>Logging fixture</h1>
      <p data-testid="home-work">{work}</p>
    </main>
  );
}
