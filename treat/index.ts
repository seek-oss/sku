// This is provided so consumers can import `sku/treat`,
// since they don't depend on `treat` directly.

// We can't re-export directly because eslint-plugin-import doesn't understand :(

import {
  createTheme,
  style,
  styleMap,
  styleTree,
  globalStyle,
  resolveStyles,
  resolveClassName,
} from 'treat';

import type {
  Style,
  GlobalStyle,
  CSSProperties,
  ThemeRef,
  ClassRef,
  TreatModule,
} from 'treat';

export {
  createTheme,
  style,
  styleMap,
  styleTree,
  resolveStyles,
  resolveClassName,
  globalStyle,
};

export type {
  Style,
  GlobalStyle,
  CSSProperties,
  ThemeRef,
  ClassRef,
  TreatModule,
};
