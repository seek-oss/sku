import { style } from '@vanilla-extract/css';
import largeImage from './large-image.png';

export const root = style({
  backgroundImage: `url(${largeImage})`,
  width: '1039px',
  height: '240px',
});
