import { Suspense } from 'react';
import { useSuspenseQuery } from '@apollo/client/react';

import { PRODUCTS_QUERY } from '../../graphql.js';

const ProductsList = () => {
  const { data } = useSuspenseQuery(PRODUCTS_QUERY);

  return (
    <ul data-testid="products-list">
      {data.products.map((product) => (
        <li key={product.id} data-testid={`product-${product.id}`}>
          {product.title}
        </li>
      ))}
    </ul>
  );
};

/** Runs `useSuspenseQuery` during document SSR so the transport can hydrate it. */
export function Component() {
  return (
    <main>
      <h1 data-testid="products-heading">Products</h1>
      <Suspense
        fallback={<p data-testid="products-fallback">Loading products…</p>}
      >
        <ProductsList />
      </Suspense>
    </main>
  );
}
