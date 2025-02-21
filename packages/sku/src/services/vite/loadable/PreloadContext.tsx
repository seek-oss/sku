import { createContext, useContext } from 'react';
import type { Collector, ModuleId } from './collector.js';

const context = createContext<null | Collector>(null);

export const LoadableProvider = context.Provider;

export const useRegisterComponent = (moduleId: ModuleId) => {
  const components = useContext(context);
  if (!components) return;
  components.register(moduleId);
};
