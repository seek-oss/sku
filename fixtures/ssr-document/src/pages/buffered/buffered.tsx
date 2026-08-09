import { Suspense, use, cache } from 'react';

const getDeferredMessage = cache(
  () =>
    new Promise<string>((resolve) => {
      setTimeout(() => resolve('Buffered content ready'), 50);
    }),
);

const DeferredMessage = () => {
  const message = use(getDeferredMessage());
  return <p data-testid="buffered-content">{message}</p>;
};

export function Component() {
  return (
    <main>
      <h1 data-testid="buffered-shell">Buffered page</h1>
      <Suspense fallback={<p data-testid="buffered-fallback">Loading…</p>}>
        <DeferredMessage />
      </Suspense>
    </main>
  );
}
