import { createContext, useContext } from 'react';
import type { Collector, ModuleId } from './collector.js';

const context = createContext<null | Collector>(null);

export const LoadableProvider = context.Provider;

export const useRegisterComponent = (moduleId: ModuleId) => {
  const collector = useContext(context);
  if (!collector) {
    throw new Error('`loadable` must be used inside the `LoadableProvider`');
  }
  collector.register(moduleId);
};
