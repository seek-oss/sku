import { createTransformer } from 'babel-jest';

import babelConfig from '../babel.js';
import targets from '../targets.json' with { type: 'json' };

const transformer: ReturnType<typeof createTransformer> = createTransformer(
  babelConfig({
    target: 'jest',
    browserslist: targets.browserslistNodeTarget,
  }),
);

export default transformer;
