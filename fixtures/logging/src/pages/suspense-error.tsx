import { Suspense, use, cache } from 'react';

const getRejectedMessage = cache(() => {
  const promise = new Promise<string>((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Boom from suspense'));
    }, 20);
  });
  // If SSR aborts the first stream for ErrorBoundary recovery, nothing may
  // remain subscribed to this rejection — keep the process alive.
  promise.catch(() => undefined);
  return promise;
});

const DeferredBoom = () => {
  const message = use(getRejectedMessage());
  return <p>{message}</p>;
};

export function Component() {
  return (
    <main data-testid="suspense-error-page">
      <h1>Suspense error</h1>
      <Suspense fallback={<p data-testid="suspense-fallback">Loading…</p>}>
        <DeferredBoom />
      </Suspense>
    </main>
  );
}
