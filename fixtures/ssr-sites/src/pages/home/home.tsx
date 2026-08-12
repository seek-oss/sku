import { useSite } from '../../ssrContext.js';

export function Component() {
  const site = useSite();

  return (
    <main>
      <h1 data-testid="shell">SSR Sites Home - {site}</h1>
    </main>
  );
}
