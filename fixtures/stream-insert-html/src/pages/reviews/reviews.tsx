import { Suspense } from 'react';
import { useSuspenseQuery } from '@apollo/client/react';

import { REVIEWS_QUERY } from '../../graphql.js';

const ReviewsList = () => {
  const { data } = useSuspenseQuery(REVIEWS_QUERY, {
    // Client-nav only route: always hit the network so the e2e can observe the
    // browser fetch (distinct from the SSR-transported Products query).
    fetchPolicy: 'network-only',
  });

  return (
    <ul data-testid="reviews-list">
      {data.reviews.map((review) => (
        <li key={review.id} data-testid={`review-${review.id}`}>
          {review.body}
        </li>
      ))}
    </ul>
  );
};

/**
 * Queried only after hydration on client navigation — browser fetch hits
 * `/api/graphql`, proving post-hydration queries still work.
 */
export function Component() {
  return (
    <main>
      <h1 data-testid="reviews-heading">Reviews</h1>
      <Suspense
        fallback={<p data-testid="reviews-fallback">Loading reviews…</p>}
      >
        <ReviewsList />
      </Suspense>
    </main>
  );
}
