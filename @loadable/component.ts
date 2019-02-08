// This is provided so consumers can import `sku/@loadable/component`,
// since they don't depend on `@loadable/component` directly.
import loadable, {
  loadableReady,
  LoadableComponent,
  LoadableLibrary
} from '@loadable/component';

export default loadable;
export { loadableReady, LoadableComponent, LoadableLibrary };
