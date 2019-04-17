// This is provided so consumers can import `sku/treat`,
// since they don't depend on `treat` directly.

// We can't re-export directly because eslint-plugin-import doesn't understand :(

import {
  createTheme,
  style,
  css,
  TreatProvider,
  useClassNames,
  useStyles,
  resolveClassNames,
  resolveStyles,
  ThemeRef,
} from 'treat';

export {
  createTheme,
  style,
  css,
  TreatProvider,
  useClassNames,
  useStyles,
  resolveClassNames,
  resolveStyles,
  ThemeRef,
};
