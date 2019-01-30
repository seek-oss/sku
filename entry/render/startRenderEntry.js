import render from './render';

// 'startConfig.json' is a file created by the htmlRenderPlugin
// it contains the current site/environment config to be rendered
import config from './startConfig.json'; // eslint-disable-line import/no-unresolved

const libraryName = SKU_LIBRARY_NAME; // eslint-disable-line no-undef

export default async renderParams =>
  await render({ ...renderParams, ...config, libraryName });
