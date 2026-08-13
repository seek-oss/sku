import type { PipeableStream } from 'react-dom/server';
import { pipeline } from 'node:stream/promises';

import { createInsertHtmlTransform } from './createInsertHtmlTransform.js';
import type { InsertHtmlQueue } from './insertHtml.js';

export const wrapPipeWithInsertHtml = (
  pipe: PipeableStream['pipe'],
  queue: InsertHtmlQueue,
  abort: PipeableStream['abort'],
): PipeableStream['pipe'] => {
  const wrappedPipe: PipeableStream['pipe'] = (destination) => {
    const transform = createInsertHtmlTransform(queue);
    const pipeToDestination = async () => {
      try {
        await pipeline(transform, destination);
      } catch {
        abort();
      }
    };
    pipeToDestination();
    try {
      pipe(transform);
    } catch (error) {
      transform.destroy(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
    return destination;
  };
  return wrappedPipe;
};
