import type { PipeableStream } from 'react-dom/server';

import { wrapPipeWithInsertHtml } from './wrapPipeWithInsertHtml.js';
import type { InsertHtmlQueue } from './insertHtml.js';
import type { CommitDocument, DocumentDestination } from './types.js';

export const bindCommit = ({
  pipe,
  abort,
  queue,
}: {
  pipe: PipeableStream['pipe'];
  abort: PipeableStream['abort'];
  queue?: InsertHtmlQueue;
}): CommitDocument => {
  const run = queue ? wrapPipeWithInsertHtml(pipe, queue, abort) : pipe;

  return (destination: DocumentDestination, options = {}) => {
    const { signal, beforePipe } = options;
    let aborted = false;
    const abortOnce = () => {
      if (aborted) {
        return;
      }
      aborted = true;
      abort();
    };

    signal?.addEventListener('abort', abortOnce, { once: true });

    if (signal?.aborted) {
      abortOnce();
      return;
    }

    try {
      beforePipe?.(destination);
    } catch (error) {
      abortOnce();
      throw error;
    }

    if (signal?.aborted) {
      abortOnce();
      return;
    }

    run(destination);
  };
};
