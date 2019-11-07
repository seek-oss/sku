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
  Style as _Style,
  GlobalStyle as _GlobalStyle,
  CSSProperties as _CSSProperties,
  ThemeRef as _ThemeRef,
  ClassRef as _ClassRef,
  TreatModule as _TreatModule,
} from 'treat';

// Provided for backwards compatibility. Remove in sku 9
import { TreatProvider, useStyles, useClassName } from 'react-treat';

export {
  createTheme,
  style,
  styleMap,
  styleTree,
  TreatProvider,
  useStyles,
  useClassName,
  resolveStyles,
  resolveClassName,
  globalStyle,
};

// We need to re-export types separately or they won't work in webpack :(((
export type Style = _Style;
export type GlobalStyle = _GlobalStyle;
export type CSSProperties = _CSSProperties;
export type ThemeRef = _ThemeRef;
export type ClassRef = _ClassRef;
export type TreatModule = _TreatModule;
