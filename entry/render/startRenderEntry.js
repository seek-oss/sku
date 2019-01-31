import render from './render';

const libraryName = SKU_LIBRARY_NAME; // eslint-disable-line no-undef

export default async renderParams =>
  await render({ ...renderParams, libraryName });
