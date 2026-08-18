import { abortReason } from './abortReason.js';
import {
  createDocumentAttempt,
  type CreateDocumentAttemptArgs,
  type DocumentAttempt,
} from './createDocumentAttempt.js';
import { getStaticContextFromError } from './getStaticContextFromError.js';
import type { DocumentDestination, RenderSuccess } from './types.js';

export type StreamDocumentArgs = CreateDocumentAttemptArgs & {
  timeoutMs?: number;
};

export const DOCUMENT_RENDER_TIMEOUT_MS = 10_000;

const isTimeoutError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'TimeoutError';

const onDestinationEnd = (
  destination: DocumentDestination,
  listener: () => void,
) => {
  const emitter = destination as DocumentDestination & {
    once?: (event: string, listener: () => void) => void;
  };
  emitter.once?.('finish', listener);
  emitter.once?.('close', listener);
};

export const streamDocument = async ({
  timeoutMs,
  ...attemptArgs
}: StreamDocumentArgs): Promise<RenderSuccess> => {
  const { options } = attemptArgs;
  const deadlineMs =
    timeoutMs ?? options.renderTimeoutMs ?? DOCUMENT_RENDER_TIMEOUT_MS;
  let renderContext = attemptArgs.renderContext;
  let retried = false;
  let currentAttempt: DocumentAttempt | undefined;

  const timeoutReason = new DOMException(
    'SSR document render exceeded the sku timeout',
    'TimeoutError',
  );

  const timeoutId =
    deadlineMs > 0
      ? setTimeout(() => {
          currentAttempt?.abort(timeoutReason);
        }, deadlineMs)
      : undefined;
  timeoutId?.unref();

  const clearDeadline = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };

  while (true) {
    const attempt = createDocumentAttempt({
      ...attemptArgs,
      renderContext,
    });
    currentAttempt = attempt;

    const cancel = () => {
      attempt.abort(abortReason(options.signal));
    };

    if (options.signal?.aborted) {
      cancel();
    } else {
      options.signal?.addEventListener('abort', cancel, { once: true });
    }

    try {
      const handle = await attempt.ready;
      options.signal?.removeEventListener('abort', cancel);
      return {
        ...handle,
        commit: (destination, commitOptions) => {
          onDestinationEnd(destination, clearDeadline);
          handle.commit(destination, commitOptions);
        },
      };
    } catch (error) {
      options.signal?.removeEventListener('abort', cancel);
      if (options.signal?.aborted) {
        clearDeadline();
        throw abortReason(options.signal);
      }
      if (isTimeoutError(error) || retried) {
        clearDeadline();
        throw error;
      }
      retried = true;
      try {
        renderContext = getStaticContextFromError(
          attemptArgs.dataRoutes,
          renderContext,
          error,
        );
      } catch {
        clearDeadline();
        throw error;
      }
    }
  }
};
