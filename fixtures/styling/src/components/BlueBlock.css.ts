import { style } from '@vanilla-extract/css';

export const border = style({
  border: '10px solid red',
});

export const root = style({
  width: '100px',
  height: '100px',
  // Optimized to `background: #00f`
  background: '#0000ff',
  fontSize: '64px',
});

export const test = style({
  // Tests that calc functions are not optimized (sku turns this off explicitly).
  // cssnano and lightningcss both incorrectly optimize this to `width: 100%`.
  width: 'calc(100vh - calc(100vh - 100%))',

  // Tests that user-agent prefixes are applied where necessary based on browser targets.
  // `height: -webkit-fill-available` and `height: -moz-available` should be added as
  // fallbacks.
  height: 'stretch',
});
