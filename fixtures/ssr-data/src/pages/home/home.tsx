import { useClientContext } from '../../skuContext.js';

export function Component() {
  const clientContext = useClientContext();

  return (
    <main>
      <h1 data-testid="shell">SSR Data Home</h1>
      <p data-testid="providers-user-id">
        {clientContext?.userId ?? 'missing'}
      </p>
    </main>
  );
}
