import { addParameters } from '@storybook/react';
import configureStorybook from '../configureStorybook';
import 'storybook-chromatic';

const provideDefaultChromaticViewports = __SKU_PROVIDE_DEFAULT_CHROMATIC_VIEWPORTS__; // eslint-disable-line no-undef

if (provideDefaultChromaticViewports) {
  addParameters({
    chromatic: { viewports: [320, 1200] },
  });
}

configureStorybook();
