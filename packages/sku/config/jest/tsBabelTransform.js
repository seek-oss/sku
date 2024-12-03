import { default as babelJest } from 'babel-jest';

import { rootResolution } from '../../context';
import babelConfig from '../babel/babelConfig';
import targets from '../targets.json';

export default babelJest.createTransformer(
  babelConfig({
    target: 'jest',
    lang: 'ts',
    rootResolution,
    browserslist: targets.browserslistNodeTarget,
  }),
);
