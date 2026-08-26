export const abortReason = (signal: AbortSignal | undefined): unknown =>
  signal?.reason ??
  new DOMException('This operation was aborted', 'AbortError');
