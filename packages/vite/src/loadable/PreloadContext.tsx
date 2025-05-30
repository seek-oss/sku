import { createContext, useContext } from 'react';
import type { Collector, ModuleId } from './collector.js';

const context = createContext<null | Collector>(null);

export const LoadableProvider = context.Provider;

export const useRegisterComponent = (moduleId: ModuleId, ssr: boolean) => {
  const collector = useContext(context);

  if (!collector) {
    if (ssr) {
      throw new Error(
        '`loadable` must be used inside a `LoadableProvider` when using SSR or SSG. Check the render or server entry and make sure it is wrapped in a `LoadableProvider`.',
      );
    }
    return;
  }
  collector.register(moduleId);
};
