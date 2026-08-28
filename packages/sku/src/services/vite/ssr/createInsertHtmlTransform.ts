import { Transform } from 'node:stream';
import { createElement, Fragment, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { InsertHtmlCallback, InsertHtmlQueue } from './insertHtml.js';

const HEAD_END = '</head>';

const renderQueuedMarkup = (callbacks: InsertHtmlCallback[]): string => {
  if (callbacks.length === 0) {
    return '';
  }

  return renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      ...callbacks.map((callback, index) =>
        createElement(Fragment, { key: index }, callback() as ReactNode),
      ),
    ),
  );
};

/**
 * Node equivalent of Apollo's Web `createInjectionTransformStream`:
 * insert the first queued markup before `</head>`, then flush further
 * injections before each subsequent React chunk (and again at stream end).
 *
 * Putting nodes before the first byte would place scripts ahead of
 * `<!DOCTYPE html>` and break hydration; head insertion keeps them in
 * document order ahead of deferred module bootstrap scripts.
 */
export const createInsertHtmlTransform = (
  queue: InsertHtmlQueue,
): Transform => {
  let headInserted = false;
  let tailOfLastChunk = '';

  const takeMarkup = (): string =>
    renderQueuedMarkup(queue.takeQueuedCallbacks());

  return new Transform({
    transform(chunk, _encoding, callback) {
      try {
        const text =
          typeof chunk === 'string'
            ? chunk
            : Buffer.from(chunk).toString('utf8');

        if (!headInserted) {
          const content = tailOfLastChunk + text;
          const index = content.indexOf(HEAD_END);
          if (index !== -1) {
            const inserted =
              content.slice(0, index) + takeMarkup() + content.slice(index);
            this.push(inserted);
            headInserted = true;
            tailOfLastChunk = '';
          } else {
            // Keep enough bytes to match `</head>` across chunk boundaries.
            tailOfLastChunk = content.slice(-HEAD_END.length);
            this.push(content.slice(0, -HEAD_END.length));
          }
          callback();
          return;
        }

        const markup = takeMarkup();
        if (markup) {
          this.push(markup);
        }
        this.push(text);
        callback();
      } catch (error) {
        callback(error as Error);
      }
    },
    flush(callback) {
      try {
        if (tailOfLastChunk) {
          // Stream ended without `</head>` — emit the held tail, then leftovers.
          this.push(tailOfLastChunk + takeMarkup());
          tailOfLastChunk = '';
        } else {
          const markup = takeMarkup();
          if (markup) {
            this.push(markup);
          }
        }
        callback();
      } catch (error) {
        callback(error as Error);
      }
    },
  });
};
