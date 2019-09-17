// This is provided so consumers can import `sku/@storybook/addon-knobs`,
// since they don't depend on `@storybook/addon-knobs` directly.

// We can't re-export directly because eslint-plugin-import doesn't understand :(

import {
  knob,
  text,
  boolean,
  files,
  number,
  color,
  object,
  radios,
  select,
  date,
  array,
  button,
  withKnobs,
} from '@storybook/addon-knobs';

export {
  knob,
  text,
  boolean,
  files,
  number,
  color,
  object,
  radios,
  select,
  date,
  array,
  button,
  withKnobs,
};
