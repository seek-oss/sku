import type { Response } from 'express';

export const sendResponse = async (
  response: globalThis.Response,
  res: Response,
  signal?: AbortSignal,
) => {
  // Buffer before touching `res` so a disconnect during the read writes nothing.
  const body = response.body
    ? Buffer.from(await response.arrayBuffer())
    : undefined;
  if (signal?.aborted) {
    return;
  }
  response.headers.forEach((value, name) => {
    res.append(name, value);
  });
  res.status(response.status);
  res.end(body);
};
