import { createContext, useContext } from 'react';
import type { Collector, ModuleId } from './collector.js';

const context = createContext<null | Collector>(null);

export const LoadableProvider = context.Provider;

export const useRegisterComponent = (moduleId: ModuleId) => {
  const collector = useContext(context);
  if (!collector) {
    if (import.meta.env.SSR) {
      throw new Error(
        'useRegisterComponent must be used inside LoadableProvider',
      );
    }
    return;
  }
  collector.register(moduleId);
};
