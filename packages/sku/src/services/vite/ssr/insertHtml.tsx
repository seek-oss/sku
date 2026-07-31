import { createContext, useContext, type ReactNode } from 'react';

export type InsertHtmlCallback = () => ReactNode;
export type InsertHtml = (callback: InsertHtmlCallback) => void;

/**
 * Render-scoped queue of HTML injection callbacks. Shared by sku's `render`
 * (provider + stream transform) and consumer `useInsertHtml` via the unbundled
 * module graph — same identity mechanism as the preload registry / CSP nonce.
 */
export type InsertHtmlQueue = {
  insertHtml: InsertHtml;
  takeQueuedCallbacks: () => InsertHtmlCallback[];
};

export const createInsertHtmlQueue = (): InsertHtmlQueue => {
  const queue: InsertHtmlCallback[] = [];

  return {
    insertHtml: (callback) => {
      queue.push(callback);
    },
    takeQueuedCallbacks: () => queue.splice(0, queue.length),
  };
};

const InsertHtmlContext = createContext<InsertHtml | null>(null);

export const InsertHtmlProvider = ({
  insertHtml,
  children,
}: {
  insertHtml: InsertHtml;
  children: ReactNode;
}) => (
  <InsertHtmlContext.Provider value={insertHtml}>
    {children}
  </InsertHtmlContext.Provider>
);

const noopInsertHtml: InsertHtml = () => {
  // Silent no-op off the SSR path (browser graph, Providers markup probe).
};

/**
 * Returns a function that queues React nodes for injection into the SSR
 * response stream between React chunks. Off the SSR path it is a silent no-op
 * and never throws — required so the development `Providers` markup probe and
 * the client graph can call transports that wire this hook at module scope.
 */
export const useInsertHtml = (): InsertHtml =>
  useContext(InsertHtmlContext) ?? noopInsertHtml;
