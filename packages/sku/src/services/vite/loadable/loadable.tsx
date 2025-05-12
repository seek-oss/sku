import {
  type ComponentType,
  createElement,
  forwardRef,
  lazy,
  type ReactNode,
  Suspense,
  useRef,
} from 'react';
import type { ModuleId } from './collector.js';
import { useRegisterComponent } from './PreloadContext.js';

let preloads: Array<() => Promise<any>> = [];

export type PreloadableComponent<T extends ComponentType<any>> = T & {
  preload: () => Promise<T>;
};

export function loadable<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } & Record<string, T>>,
  options?: {
    fallback?: NonNullable<ReactNode> | null;
    resolveComponent?: (module: { default: T } & Record<string, T>) => T;
  },
  moduleId: ModuleId = '', // Gets set via the plugin
): PreloadableComponent<T> {
  const getResolvedOrDefaultExport = (
    module: { default: T } & Record<string, T>,
  ) =>
    options?.resolveComponent
      ? options.resolveComponent(module)
      : module.default;

  const lazyFactory = async () => {
    const module = await factory();
    return { default: getResolvedOrDefaultExport(module) };
  };
  const ReactLazyComponent = lazy(lazyFactory);
  let PreloadedComponent: T | undefined;
  let factoryPromise: Promise<T> | undefined;

  const Component = forwardRef(function LazyWithPreload(props, ref) {
    // Once one of these is chosen, we must ensure that it continues to be
    // used for all subsequent renders, otherwise it can cause the
    // underlying component to be unmounted and remounted.
    const ComponentToRender = useRef(PreloadedComponent ?? ReactLazyComponent);
    useRegisterComponent(moduleId);
    if (options?.fallback) {
      return (
        <Suspense fallback={options?.fallback}>
          {createElement(
            ComponentToRender.current,
            Object.assign(ref ? { ref } : {}, props) as any,
          )}
        </Suspense>
      );
    }
    return createElement(
      ComponentToRender.current,
      Object.assign(ref ? { ref } : {}, props) as any,
    );
  });

  const LazyWithPreload = Component as any as PreloadableComponent<T>;

  LazyWithPreload.preload = () => {
    if (!factoryPromise) {
      factoryPromise = factory().then((module) => {
        PreloadedComponent = getResolvedOrDefaultExport(module);
        return PreloadedComponent;
      });
    }

    return factoryPromise;
  };

  preloads.push(LazyWithPreload.preload);

  return LazyWithPreload;
}

export async function preloadAll(depth: number = 3) {
  for (let i = 0; i < depth && preloads.length > 0; i++) {
    const _preloads = preloads;
    preloads = [];

    if (_preloads.length === 0) {
      return;
    }
    await Promise.all(_preloads.map((preload) => preload()));
  }
}
