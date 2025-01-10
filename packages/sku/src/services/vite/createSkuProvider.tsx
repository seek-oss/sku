import { ReactNode } from 'react';
import { ChunkCollectorContext, type ChunkCollector } from 'vite-preload';

export const createSkuProvider =
  (collector: ChunkCollector) =>
  ({ children }: { children: ReactNode }) => (
    <ChunkCollectorContext collector={collector}>
      {children}
    </ChunkCollectorContext>
  );
