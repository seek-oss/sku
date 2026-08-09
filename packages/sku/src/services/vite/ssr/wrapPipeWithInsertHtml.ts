import type { PipeableStream } from 'react-dom/server';

import { createInsertHtmlTransform } from './createInsertHtmlTransform.js';
import type { InsertHtmlQueue } from './insertHtml.js';

export const wrapPipeWithInsertHtml = (
  pipe: PipeableStream['pipe'],
  queue: InsertHtmlQueue,
): PipeableStream['pipe'] => {
  const wrappedPipe: PipeableStream['pipe'] = (destination) => {
    const transform = createInsertHtmlTransform(queue);
    pipe(transform);
    return transform.pipe(destination);
  };
  return wrappedPipe;
};
