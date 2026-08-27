import type { Request, RequestHandler, Response } from 'express';
import type { ReportingEndpoint } from '../../../utils/csp.js';
import { buildCspHeaders } from './csp.js';
import { getRequestContextStore } from './ssrRequestContextMiddleware.js';
import { createSsrRequestContextStore } from './createSsrRequestContextStore.js';
import { createWebRequest } from './createWebRequest.js';
import { sendResponse } from './sendResponse.js';
import type {
  RenderAssets,
  RenderManifest,
  RenderOptions,
  RenderResult,
  SkuMiddleware,
  SkuOnListen,
} from './types.js';

export type RenderFunction = (
  request: globalThis.Request,
  req: Request,
  assets: RenderAssets,
  options?: RenderOptions,
  manifest?: RenderManifest,
) => Promise<RenderResult>;

/** Named exports from sku’s internal `ssr-server` entry (not `SkuServerEntry`). */
export type SsrServerModule = {
  middleware?: SkuMiddleware;
  onListen?: SkuOnListen;
  render: RenderFunction;
};

export const createHtmlRenderMiddleware =
  ({
    render,
    assets,
    manifest,
    cspEnabled,
    cspExtraScriptSrcHosts,
    cspReportTo,
    cspReportOnlyEnabled,
    cspReportOnlyExtraScriptSrcHosts,
    cspReportOnlyReportTo,
    development = false,
    onRenderError,
  }: {
    render: RenderFunction;
    assets: RenderAssets;
    manifest?: RenderManifest;
    cspEnabled: boolean;
    cspExtraScriptSrcHosts: string[];
    cspReportTo?: ReportingEndpoint;
    cspReportOnlyEnabled: boolean;
    cspReportOnlyExtraScriptSrcHosts: string[];
    cspReportOnlyReportTo?: ReportingEndpoint;
    development?: boolean;
    onRenderError?: (error: Error) => void;
  }): RequestHandler =>
  async (req, res, next) => {
    const controller = new AbortController();
    const onClose = () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    };
    res.once('close', onClose);

    // Skip starting render when the client is already gone.
    if (req.destroyed || res.writableEnded) {
      controller.abort();
      return;
    }

    try {
      const requestContextStore =
        getRequestContextStore(req) ?? createSsrRequestContextStore();
      const result = await render(
        createWebRequest(req, controller.signal),
        req,
        assets,
        {
          requestContextStore,
          signal: controller.signal,
          development,
          onError: (error) => console.error(error),
        },
        manifest,
      );

      if ('response' in result) {
        if (controller.signal.aborted) {
          return;
        }
        await sendResponse(result.response, res, controller.signal);
        return;
      }

      result.commit(res, {
        signal: controller.signal,
        beforePipe: (destination) => {
          const expressRes = destination as Response;
          result.headers.forEach((value, name) => {
            expressRes.append(name, value);
          });
          expressRes.set({
            'Content-Type': 'text/html; charset=utf-8',
            ...buildCspHeaders({
              enabled: cspEnabled,
              reportOnlyEnabled: cspReportOnlyEnabled,
              inlineScripts: result.inlineScripts,
              nonce: requestContextStore.peekCspNonce(),
              extraHosts: cspExtraScriptSrcHosts,
              reportTo: cspReportTo,
              reportOnlyExtraHosts: cspReportOnlyExtraScriptSrcHosts,
              reportOnlyReportTo: cspReportOnlyReportTo,
              development,
            }),
          });
          expressRes.status(result.statusCode);
        },
      });
    } catch (error) {
      // Cancellation rejections must not reach Express error handling.
      if (controller.signal.aborted) {
        return;
      }
      onRenderError?.(error as Error);
      next(error);
    }
  };
