import React from 'react';
import { configure, addDecorator } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

export default () => {
  addDecorator(withKnobs);
  addDecorator(story =>
    // When applying a CSS transform to the root element of a component,
    // e.g. when using Basekick (https://github.com/michaeltaranto/basekick),
    // screenshot services (such a Chromatic) would render the element
    // but not at the translated position. To fix this, we wrap each story
    // in a div, which implicitly doesn't have a transform, but serves as the
    // element presented in the screenshot.
    // We also provide a near-zero bottom padding value in order to
    // prevent margins from collapsing, otherwise screenshot services will
    // ignore bottom margins, leading to missed changes when margin values
    // change, or unwanted diffs when migrating from margin to padding.
    React.createElement('div', { style: { paddingBottom: '0.05px' } }, story()),
  );

  const reqs = [
    // These values are defined in `storybookWebpackConfig.js` in this
    // directory, along with a comment explaining the reasoning.
    require.context(__SKU_SRC_PATHS_0__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_1__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_2__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_3__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_4__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_5__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_6__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_7__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_8__, true, /\.stories\.(j|t)sx?$/),
    require.context(__SKU_SRC_PATHS_9__, true, /\.stories\.(j|t)sx?$/),
  ];

  function loadStories() {
    reqs.forEach(req => {
      req.keys().forEach(filename => req(filename));
    });
  }

  configure(loadStories, module);
};
