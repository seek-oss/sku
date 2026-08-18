import type { IncomingHttpHeaders } from 'node:http';
import type { Request } from 'express';

const toFetchHeaders = (headers: IncomingHttpHeaders): Headers => {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        result.append(name, entry);
      }
    } else {
      result.append(name, value);
    }
  }
  return result;
};

const appendFormValue = (
  params: URLSearchParams,
  key: string,
  value: unknown,
) => {
  if (value === undefined || value === null) {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      appendFormValue(params, key, item);
    }
    return;
  }
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      appendFormValue(params, `${key}[${childKey}]`, childValue);
    }
    return;
  }
  params.append(key, String(value));
};

/** Rebuild a body-parser object using the original Content-Type. */
const rebuildParsedBody = (req: Request): BodyInit => {
  const { body } = req;
  if (typeof body === 'string') {
    return body;
  }
  if (Buffer.isBuffer(body)) {
    return new Uint8Array(body);
  }
  if (typeof body !== 'object' || body === null) {
    return String(body);
  }

  const contentType = String(req.headers['content-type'] ?? '');
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(
      body as Record<string, unknown>,
    )) {
      appendFormValue(params, key, value);
    }
    return params.toString();
  }

  return JSON.stringify(body);
};

const getRequestBodyInit = (
  req: Request,
  method: string,
): { body?: BodyInit; duplex?: 'half' } => {
  if (method === 'GET' || method === 'HEAD') {
    return {};
  }

  // Only `readableEnded` means the stream was consumed (e.g. body-parser).
  // Do not use `IncomingMessage.complete` — that is true once the HTTP message
  // has arrived, even when the body buffer is still unread. Async middleware
  // before render commonly hits that race and would otherwise drop POST bodies.
  if (req.readableEnded) {
    if (req.body === undefined || req.body === null) {
      return {};
    }
    return { body: rebuildParsedBody(req) };
  }

  return { body: req as unknown as BodyInit, duplex: 'half' };
};

export const createWebRequest = (
  req: Request,
  signal: AbortSignal,
): globalThis.Request => {
  const origin = `${req.protocol}://${req.get('host') ?? 'localhost'}`;
  const method = req.method.toUpperCase();
  const bodyInit = getRequestBodyInit(req, method);
  return new globalThis.Request(new URL(req.originalUrl, origin), {
    method,
    headers: toFetchHeaders(req.headers),
    signal,
    ...bodyInit,
  } as RequestInit);
};
