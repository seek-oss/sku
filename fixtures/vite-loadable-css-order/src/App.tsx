import 'braid-design-system/reset';
import { loadable } from '@sku-lib/vite/loadable';
import { MyComponent } from '@sku-private/react-lib-with-loadable';
import { Actions, BraidProvider, Button, Stack } from 'braid-design-system';
import seekJobs from 'braid-design-system/themes/seekJobs';
import { StrictMode } from 'react';
import { Routes, Route } from 'react-router';

import { Nav } from './Nav.tsx';
import { routes } from './routes';

const Home = loadable(() => import('./Home.tsx'), {
  resolveComponent: (module) => module.Home,
});
const Details = loadable(() => import('./Details.tsx'), {
  resolveComponent: (module) => module.Details,
});

export const App = () => (
  <StrictMode>
    <BraidProvider theme={seekJobs}>
      <Stack space="medium">
        <MyComponent />
        <Routes>
          <Route path={routes.home.path} element={<Home />} />
          <Route path={routes.details.path} element={<Details />} />
        </Routes>
        <Nav />
        <Actions>
          <Button>Click me</Button>
        </Actions>
      </Stack>
    </BraidProvider>
  </StrictMode>
);
