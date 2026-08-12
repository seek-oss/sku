import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  createInsertHtmlQueue,
  InsertHtmlProvider,
  useInsertHtml,
} from './insertHtml.js';

const Probe = ({ onReady }: { onReady: (insert: () => void) => void }) => {
  const insertHtml = useInsertHtml();
  onReady(() => {
    insertHtml(() => <script data-testid="injected" />);
  });
  return <span>probe</span>;
};

describe('useInsertHtml', () => {
  it('queues nodes when an InsertHtmlProvider is present', () => {
    const queue = createInsertHtmlQueue();
    let runInsert: (() => void) | undefined;

    renderToStaticMarkup(
      <InsertHtmlProvider insertHtml={queue.insertHtml}>
        <Probe
          onReady={(fn) => {
            runInsert = fn;
          }}
        />
      </InsertHtmlProvider>,
    );

    runInsert?.();
    const callbacks = queue.takeQueuedCallbacks();
    expect(callbacks).toHaveLength(1);
    expect(renderToStaticMarkup(<div>{callbacks[0]?.()}</div>)).toContain(
      'data-testid="injected"',
    );
  });

  it('is a silent no-op without an injection context', () => {
    let runInsert: (() => void) | undefined;

    expect(() => {
      renderToStaticMarkup(
        <Probe
          onReady={(fn) => {
            runInsert = fn;
          }}
        />,
      );
      runInsert?.();
    }).not.toThrow();
  });

  it('does not throw when called from a component outside the SSR path', () => {
    const Wrapper = ({ children }: { children: ReactNode }) => {
      const insertHtml = useInsertHtml();
      insertHtml(() => <script>should-not-run</script>);
      return children;
    };

    expect(() => renderToStaticMarkup(<Wrapper>child</Wrapper>)).not.toThrow();
  });

  it('accepts further inserts after the queue is drained', () => {
    const queue = createInsertHtmlQueue();
    const warn = vi.fn();

    queue.insertHtml(() => <meta name="a" />);
    expect(queue.takeQueuedCallbacks()).toHaveLength(1);
    expect(queue.takeQueuedCallbacks()).toHaveLength(0);

    expect(() => {
      queue.insertHtml(() => {
        warn();
        return <meta name="b" />;
      });
    }).not.toThrow();
    expect(queue.takeQueuedCallbacks()).toHaveLength(1);
  });
});
