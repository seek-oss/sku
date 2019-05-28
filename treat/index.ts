// This is provided so consumers can import `sku/treat`,
// since they don't depend on `treat` directly.

// We can't re-export directly because eslint-plugin-import doesn't understand :(

import {
  createTheme,
  style,
  styleMap,
  css,
  globalStyle,
  resolveStyles,
  resolveClassName,
  resolveClassNames,
  Style,
  Styles,
  GlobalStyle,
  CSSProperties,
  ThemeRef,
  ClassRef,
  TreatModule,
} from 'treat';

// Provided for backwards compatibility. Remove in sku 9
import {
  TreatProvider,
  useStyles,
  useClassName,
  useClassNames,
} from 'react-treat';

export {
  createTheme,
  style,
  styleMap,
  css,
  TreatProvider,
  useStyles,
  useClassName,
  useClassNames,
  resolveStyles,
  resolveClassName,
  resolveClassNames,
  globalStyle,
};

// We need to re-export types separately or they won't work in webpack :(((
export type Style = Style;
export type Styles = Styles;
export type GlobalStyle = GlobalStyle;
export type CSSProperties = CSSProperties;
export type ThemeRef = ThemeRef;
export type ClassRef = ClassRef;
export type TreatModule = TreatModule;
