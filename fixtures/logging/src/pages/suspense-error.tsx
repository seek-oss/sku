import { Suspense, use, useState } from 'react';

const getRejectedMessage = () => {
  const promise = new Promise<string>((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Boom from suspense'));
    }, 20);
  });
  // If SSR aborts the first stream for ErrorBoundary recovery, nothing may
  // remain subscribed to this rejection — keep the process alive.
  promise.catch(() => undefined);
  return promise;
};

const DeferredBoom = ({ promise }: { promise: Promise<string> }) => {
  const message = use(promise);
  return <p>{message}</p>;
};

export function Component() {
  const [rejectedMessage] = useState(getRejectedMessage);

  return (
    <main data-testid="suspense-error-page">
      <h1>Suspense error</h1>
      <Suspense fallback={<p data-testid="suspense-fallback">Loading…</p>}>
        <DeferredBoom promise={rejectedMessage} />
      </Suspense>
    </main>
  );
}
