import { style } from '@vanilla-extract/css';

export const root = style({ display: 'flex' });

export const nested = style({
  selectors: {
    [`${root} &`]: {
      fontSize: '32px',
    },
  },
});
