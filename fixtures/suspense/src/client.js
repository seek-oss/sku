import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import App from './App';

export default ({ site, dehydratedState }) => {
  console.log({ dehydratedState });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 2 * 1000 } },
  });

  hydrateRoot(
    document.getElementById('app'),
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <App site={site} />
        </HydrationBoundary>
      </QueryClientProvider>
    </BrowserRouter>,
  );
};
