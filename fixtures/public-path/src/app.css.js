import { style } from '@vanilla-extract/css';
import largeImageAvif from './large-image.avif';
import largeImageBmp from './large-image.bmp';
import largeImageGif from './large-image.gif';
import largeImageJpg from './large-image.jpg';
import largeImagePng from './large-image.png';
import largeImageWebp from './large-image.webp';

export const avif = style({
  backgroundImage: `url(${largeImageAvif})`,
  width: '1039px',
  height: '240px',
});

export const bmp = style({
  backgroundImage: `url(${largeImageBmp})`,
  width: '1039px',
  height: '240px',
});

export const gif = style({
  backgroundImage: `url(${largeImageGif})`,
  width: '1039px',
  height: '240px',
});

export const jpg = style({
  backgroundImage: `url(${largeImageJpg})`,
  width: '1039px',
  height: '240px',
});

export const png = style({
  backgroundImage: `url(${largeImagePng})`,
  width: '1039px',
  height: '240px',
});

export const webp = style({
  backgroundImage: `url(${largeImageWebp})`,
  width: '1039px',
  height: '240px',
});
