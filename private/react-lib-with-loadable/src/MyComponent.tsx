import { loadable } from '@sku-lib/vite/loadable';
import { Text } from 'braid-design-system';

const MyAsyncComponent = loadable(() => import('./MyAsyncComponent.tsx'));

export const MyComponent = () => (
  <div>
    <Text>Async component from dep</Text>
    <MyAsyncComponent />
  </div>
);
