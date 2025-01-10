import { style } from '@vanilla-extract/css';

import { backgroundColor } from './vars.css.ts';

export const vanillaBox = style({
  vars: {
    [backgroundColor]: 'blueviolet',
  },
  backgroundColor,
  color: 'white',
  fontSize: 20,
  padding: 100,
});
