import { describe, beforeAll, it, expect } from 'vitest';
import {
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';
import { createPage } from '@sku-private/playwright';

const { sku, node } = scopeToFixture('stream-insert-html');

const hydrateApolloApp = async (url: string) => {
  const page = await createPage();
  const graphqlRequests: string[] = [];

  page.on('request', (request) => {
    if (request.url().includes('/api/graphql')) {
      graphqlRequests.push(request.url());
    }
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.getByTestId('products-list').waitFor({ state: 'visible' });
  const productText = await page.getByTestId('product-1').textContent();

  // Wait until the client has hydrated (Link intercepts clicks).
  await page.waitForFunction(() =>
    Boolean(document.querySelector('[data-testid="nav-reviews"]')?.isConnected),
  );
  await page.getByTestId('nav-reviews').click();
  await page.waitForURL('**/reviews');
  await page.getByTestId('reviews-list').waitFor({ state: 'visible' });
  const reviewText = await page.getByTestId('review-1').textContent();

  await waitFor(
    () => {
      if (
        !graphqlRequests.some((requestUrl) => requestUrl.includes('Reviews'))
      ) {
        throw new Error('Expected a Reviews GraphQL request after client nav');
      }
    },
    { timeout: 5000 },
  );

  await page.close();

  return {
    productText,
    reviewText,
    refetchProducts: graphqlRequests.some((requestUrl) =>
      requestUrl.includes('Products'),
    ),
  };
};

describe('stream-insert-html', () => {
  describe('start', () => {
    const url = 'http://127.0.0.1:8210';

    beforeAll(async () => {
      const start = await sku('start');
      await start.findByText('Starting development server');
    });

    it('injects transport markup with a CSP nonce before hydration', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(url);
      const html = await response.text();
      const csp = response.headers.get('content-security-policy');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('data-testid="products-heading"');
      // Apollo transport scripts land inside `</head>` (before hydrate).
      expect(html).toContain('ApolloSSRDataTransport');
      const injectedAt = html.indexOf('ApolloSSRDataTransport');
      expect(injectedAt).toBeGreaterThan(html.indexOf('<head'));
      expect(injectedAt).toBeLessThan(html.indexOf('</head>'));
      expect(csp).toMatch(/'nonce-/);

      const nonce = csp?.match(/'nonce-([^']+)'/)?.[1];
      expect(nonce).toBeTruthy();
      expect(html).toContain(`nonce="${nonce}"`);
    });

    it('hydrates server-run queries without refetch and fetches on client nav', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const { productText, reviewText, refetchProducts } =
        await hydrateApolloApp(url);

      expect(productText).toContain('Apollo Beanie');
      expect(reviewText).toContain('Hydration works');
      // Server-run Products query must not have been refetched after hydrate.
      expect(refetchProducts).toBe(false);
    });
  });

  describe('build + start:prod', () => {
    const url = 'http://127.0.0.1:8211';

    beforeAll(async () => {
      const build = await sku('build');
      await expect(build).toMatchExitCode(0);
    });

    it('passes Apollo hydration on the production browser/node builds', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await node(['dist/server/server.js'], {
        spawnOpts: {
          env: { ...process.env, PORT: '8211' },
        },
      });

      await waitFor(
        async () => {
          const response = await fetch(url);
          expect(response.ok).toBe(true);
        },
        { timeout: 15000 },
      );

      const { productText, reviewText, refetchProducts } =
        await hydrateApolloApp(url);

      expect(productText).toContain('Apollo Beanie');
      expect(reviewText).toContain('Hydration works');
      expect(refetchProducts).toBe(false);
    });
  });
});
