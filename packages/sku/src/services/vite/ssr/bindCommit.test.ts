import { describe, expect, it, vi } from 'vitest';
import { Writable } from 'node:stream';
import type { PipeableStream } from 'react-dom/server';

import { bindCommit } from './bindCommit.js';

describe('bindCommit', () => {
  it('does not pipe when the signal is aborted during beforePipe', () => {
    const abort = vi.fn() as PipeableStream['abort'];
    const pipe = vi.fn(
      (destination: NodeJS.WritableStream) => destination,
    ) as PipeableStream['pipe'];
    const controller = new AbortController();
    const destination = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    bindCommit({ pipe, abort })(destination, {
      signal: controller.signal,
      beforePipe: () => {
        controller.abort();
      },
    });

    expect(abort).toHaveBeenCalled();
    expect(pipe).not.toHaveBeenCalled();
  });
});
