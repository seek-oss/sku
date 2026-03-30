import { style } from '@vanilla-extract/css';

import largeImageAvif from './large-image.avif';
import largeImageBmp from './large-image.bmp';
import largeImageGif from './large-image.gif';
import largeImageJpg from './large-image.jpg';
import largeImagePng from './large-image.png';
import largeImageSvg from './large-image.svg';
import largeImageSvgInline from './large-image.svg?inline';
import largeImageSvgRaw from './large-image.svg?raw';
import largeImageSvgUrl from './large-image.svg?url';
import largeImageWebp from './large-image.webp';
import smallImageSvg from './small-image.svg';

export const avif = style({
  backgroundImage: `url("${largeImageAvif}")`,
  width: '1039px',
  height: '240px',
});

export const bmp = style({
  backgroundImage: `url("${largeImageBmp}")`,
  width: '1039px',
  height: '240px',
});

export const gif = style({
  backgroundImage: `url("${largeImageGif}")`,
  width: '1039px',
  height: '240px',
});

export const jpg = style({
  backgroundImage: `url("${largeImageJpg}")`,
  width: '1039px',
  height: '240px',
});

export const png = style({
  backgroundImage: `url("${largeImagePng}")`,
  width: '1039px',
  height: '240px',
});

export const webp = style({
  backgroundImage: `url("${largeImageWebp}")`,
  width: '1039px',
  height: '240px',
});

const encodeSvgDataUrl = (s) =>
  `data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}`;

const encodeIfNotDataUrl = (s) =>
  s.startsWith('data:') ? s : encodeSvgDataUrl(s);

// Conditionally encode SVG imports with no query params to handle differences between webpack and vite
export const svg = style({
  backgroundImage: `url("${encodeIfNotDataUrl(largeImageSvg)}")`,
  width: '1039px',
  height: '240px',
});

export const smallSvg = style({
  backgroundImage: `url("${encodeIfNotDataUrl(smallImageSvg)}")`,
  width: '50px',
  height: '50px',
});

// SVGs imported with query params provide consistent behaviour across bundlers
export const svgInline = style({
  backgroundImage: `url("${largeImageSvgInline}")`,
  width: '1039px',
  height: '240px',
});

export const svgRaw = style({
  backgroundImage: `url("${encodeSvgDataUrl(largeImageSvgRaw)}")`,
  width: '1039px',
  height: '240px',
});

export const svgUrl = style({
  backgroundImage: `url("${largeImageSvgUrl}")`,
  width: '1039px',
  height: '240px',
});
