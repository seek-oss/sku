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
  Style,
  GlobalStyle,
  CSSProperties,
  ThemeRef,
  ClassRef,
  TreatModule,
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
export type Style = Style;
export type GlobalStyle = GlobalStyle;
export type CSSProperties = CSSProperties;
export type ThemeRef = ThemeRef;
export type ClassRef = ClassRef;
export type TreatModule = TreatModule;
