import { createElement } from 'react';

export const decorators = [
  (story) =>
    // When applying a CSS transform to the root element of a component,
    // e.g. when using Capsize (https://github.com/seek-oss/capsize),
    // screenshot services (such a Chromatic) would render the element
    // but not at the translated position. To fix this, we wrap each story
    // in a div, which implicitly doesn't have a transform, but serves as the
    // element presented in the screenshot.
    // We also provide a near-zero bottom padding value in order to
    // prevent margins from collapsing, otherwise screenshot services will
    // ignore bottom margins, leading to missed changes when margin values
    // change, or unwanted diffs when migrating from margin to padding.
    createElement('div', { style: { paddingBottom: '0.05px' } }, story()),
];
