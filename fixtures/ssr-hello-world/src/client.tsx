import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { Root } from './App';

hydrateRoot(
  document,
  <StrictMode>
    <Root />
  </StrictMode>,
);
