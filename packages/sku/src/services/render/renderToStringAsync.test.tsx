import { Suspense, use } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderToStringAsync } from './renderToStringAsync.js';

const neverResolving = new Promise<string>(() => {});

const Data = ({ promise }: { promise: Promise<string> }) => (
  <p>{use(promise)}</p>
);

const ThrowsError = (): never => {
  throw new Error('Render failed');
};

const letReactRender = () => new Promise((resolve) => setImmediate(resolve));

describe('renderToStringAsync', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a tree without Suspense', async () => {
    await expect(renderToStringAsync(<div>hello</div>)).resolves.toBe(
      '<div>hello</div>',
    );
  });

  it('waits for Suspense boundaries to resolve', async () => {
    const promise = new Promise<string>((resolve) =>
      setTimeout(() => resolve('resolved data'), 10),
    );

    const html = await renderToStringAsync(
      <Suspense fallback={<i>loading</i>}>
        <Data promise={promise} />
      </Suspense>,
    );

    expect(html).toContain('<p>resolved data</p>');
    expect(html).not.toContain('loading');
  });

  it('rejects when the shell errors', async () => {
    await expect(renderToStringAsync(<ThrowsError />)).rejects.toThrow(
      'Render failed',
    );
  });

  it('renders the fallback when a Suspense boundary errors', async () => {
    const html = await renderToStringAsync(
      <main>
        <h1>title</h1>
        <Suspense fallback={<i>loading</i>}>
          <ThrowsError />
        </Suspense>
      </main>,
    );

    expect(html).toContain('<h1>title</h1>');
    expect(html).toContain('<i>loading</i>');
  });

  it('renders the fallback for boundaries still suspended after the timeout', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    let settled = false;
    const result = renderToStringAsync(
      <main>
        <h1>title</h1>
        <Suspense fallback={<i>loading</i>}>
          <Data promise={neverResolving} />
        </Suspense>
      </main>,
    ).finally(() => {
      settled = true;
    });

    await letReactRender();
    await vi.advanceTimersByTimeAsync(4999);
    await letReactRender();
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const html = await result;

    expect(html).toContain('<h1>title</h1>');
    expect(html).toContain('<i>loading</i>');
  });

  it.each([
    {
      name: 'the root',
      node: (
        <main>
          <h1>title</h1>
          <Data promise={neverResolving} />
        </main>
      ),
    },
    {
      name: 'a root-level Suspense boundary',
      node: (
        <Suspense fallback={<i>loading</i>}>
          <Data promise={neverResolving} />
        </Suspense>
      ),
    },
  ])(
    'rejects when $name is still suspended after the timeout',
    async ({ node }) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      const rejection = renderToStringAsync(node).catch((error) => error);

      await letReactRender();
      await vi.advanceTimersByTimeAsync(5000);
      await letReactRender();

      const error = await rejection;
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        'message',
        'Timeout during Render. Render did not complete in time. You may have a hanging promise or perpetually suspended component.',
      );
    },
  );

  it('resolves with an empty string for an empty node', async () => {
    await expect(renderToStringAsync(null)).resolves.toBe('');
  });

  it('clears the timeout once rendering completes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    await renderToStringAsync(<div>hello</div>);

    expect(vi.getTimerCount()).toBe(0);
  });
});
