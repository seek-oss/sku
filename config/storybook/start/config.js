import { addParameters } from '@storybook/react';
import configureStorybook from '../configureStorybook';
import 'storybook-chromatic';

const screenshotWidths = __SKU_SCREENSHOT_WIDTHS__; // eslint-disable-line no-undef

if (Array.isArray(screenshotWidths) && screenshotWidths.length > 0) {
  addParameters({
    chromatic: { viewports: screenshotWidths },
  });
}

configureStorybook();
