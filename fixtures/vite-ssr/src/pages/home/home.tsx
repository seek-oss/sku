import { Suspense, use, cache } from 'react';

const getDeferredMessage = cache(
  () =>
    new Promise<string>((resolve) => {
      setTimeout(() => resolve('Deferred content ready'), 50);
    }),
);

const DeferredMessage = () => {
  const message = use(getDeferredMessage());
  return <p data-testid="deferred">{message}</p>;
};

export function Component() {
  return (
    <main>
      <h1 data-testid="shell">Vite SSR Home</h1>
      <Suspense fallback={<p data-testid="fallback">Loading…</p>}>
        <DeferredMessage />
      </Suspense>
    </main>
  );
}
