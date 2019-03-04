import { addParameters } from '@storybook/react';
import configureStorybook from '../configureStorybook';

import 'storybook-chromatic';

addParameters({
  chromatic: { viewports: [320, 1200] },
});

configureStorybook();
