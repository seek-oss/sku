import babelJest from 'babel-jest';

import babelConfig from '../babel/babelConfig.js';
import targets from '../targets.json' with { type: 'json' };
import { getSkuContext } from '@/context/createSkuContext.js';

const { rootResolution } = getSkuContext();

export default babelJest.createTransformer(
  babelConfig({
    target: 'jest',
    lang: 'ts',
    rootResolution,
    browserslist: targets.browserslistNodeTarget,
  }),
);
