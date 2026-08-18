import { PassThrough, Writable } from 'node:stream';
import type { PipeableStream } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { createInsertHtmlQueue } from './insertHtml.js';
import { wrapPipeWithInsertHtml } from './wrapPipeWithInsertHtml.js';

describe('wrapPipeWithInsertHtml', () => {
  it('aborts React and errors the destination when an insert callback throws', async () => {
    const abort = vi.fn();
    const queue = createInsertHtmlQueue();
    queue.insertHtml(() => {
      throw new Error('insert boom');
    });

    const pipe: PipeableStream['pipe'] = (destination) => {
      const source = new PassThrough();
      source.pipe(destination);
      source.end('<!DOCTYPE html><html><head></head><body></body></html>');
      return destination;
    };

    const wrapped = wrapPipeWithInsertHtml(pipe, queue, abort);

    await expect(
      new Promise<void>((resolve, reject) => {
        const writable = new Writable({
          write(_chunk, _encoding, callback) {
            callback();
          },
          final(callback) {
            callback();
            resolve();
          },
        });
        writable.on('error', reject);
        wrapped(writable);
      }),
    ).rejects.toThrow('insert boom');

    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('pipes successfully when inserts succeed', async () => {
    const abort = vi.fn();
    const queue = createInsertHtmlQueue();
    queue.insertHtml(() => <meta name="injected" />);

    const pipe: PipeableStream['pipe'] = (destination) => {
      const source = new PassThrough();
      source.pipe(destination);
      source.end('<!DOCTYPE html><html><head></head><body>ok</body></html>');
      return destination;
    };

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        },
        final(callback) {
          callback();
          resolve();
        },
      });
      writable.on('error', reject);
      wrapPipeWithInsertHtml(pipe, queue, abort)(writable);
    });

    const html = Buffer.concat(chunks).toString('utf-8');
    expect(html).toContain('name="injected"');
    expect(html).toContain('>ok<');
    expect(abort).not.toHaveBeenCalled();
  });
});
