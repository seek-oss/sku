import {
  type ComponentType,
  createElement,
  forwardRef,
  lazy,
  useRef,
} from 'react';
import type { ModuleId } from './collector.js';
import { useRegisterComponent } from './PreloadContext.jsx';

let preloads: Array<() => Promise<any>> = [];

export type PreloadableComponent<T extends ComponentType<any>> = T & {
  preload: () => Promise<T>;
};

export function loadable<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  moduleId: ModuleId = '', // Gets set via the plugin
): PreloadableComponent<T> {
  const ReactLazyComponent = lazy(factory);
  let PreloadedComponent: T | undefined;
  let factoryPromise: Promise<T> | undefined;

  const Component = forwardRef(function LazyWithPreload(props, ref) {
    // Once one of these is chosen, we must ensure that it continues to be
    // used for all subsequent renders, otherwise it can cause the
    // underlying component to be unmounted and remounted.
    const ComponentToRender = useRef(PreloadedComponent ?? ReactLazyComponent);
    useRegisterComponent(moduleId);
    return createElement(
      ComponentToRender.current,
      Object.assign(ref ? { ref } : {}, props) as any,
    );
  });

  const LazyWithPreload = Component as any as PreloadableComponent<T>;

  LazyWithPreload.preload = () => {
    if (!factoryPromise) {
      factoryPromise = factory().then((module) => {
        PreloadedComponent = module.default;
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
