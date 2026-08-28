import type { PipeableStream } from 'react-dom/server';

import { createInsertHtmlTransform } from './createInsertHtmlTransform.js';
import type { InsertHtmlQueue } from './insertHtml.js';

// React defines `pipe`'s destination as `NodeJS.WritableStream` (writable / write /
// end only). `destroy` / `destroyed` live on the concrete `stream.Writable` class
// (and Express `res`), which is what we get at runtime. Casting through
// `stream.Writable` fails because TypeScript treats the two as insufficiently
// overlapping, so this structural type is the narrow cast surface.
type DestroyableDestination = {
  destroyed?: boolean;
  destroy?: (error?: Error) => void;
};

export const wrapPipeWithInsertHtml = (
  pipe: PipeableStream['pipe'],
  queue: InsertHtmlQueue,
  abort: PipeableStream['abort'],
): PipeableStream['pipe'] => {
  const wrappedPipe: PipeableStream['pipe'] = (destination) => {
    const transform = createInsertHtmlTransform(queue);
    // Node pipe() does not forward errors. On insert/transform failure, abort
    // React and error the destination. Do not treat React onError as success.
    transform.on('error', (error: Error) => {
      abort();
      const nodeDestination = destination as DestroyableDestination;
      if (!nodeDestination.destroyed) {
        nodeDestination.destroy?.(error);
      }
    });
    const output = transform.pipe(destination);
    pipe(transform);
    return output;
  };
  return wrappedPipe;
};
