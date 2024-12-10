import babelJest from 'babel-jest';

import { rootResolution } from '../../context/index.js';
import babelConfig from '../babel/babelConfig.js';
import targets from '../targets.json' with { type: 'json' };

export default babelJest.createTransformer(
  babelConfig({
    target: 'jest',
    rootResolution,
    browserslist: targets.browserslistNodeTarget,
  }),
);
