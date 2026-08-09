import { data } from 'react-router';

export function loader() {
  return data(
    { ok: true },
    {
      headers: {
        'Set-Cookie': 'sku-vite-ssr=1; Path=/; HttpOnly',
      },
    },
  );
}

export function Component() {
  return <main data-testid="cookie-page">Cookie page</main>;
}
