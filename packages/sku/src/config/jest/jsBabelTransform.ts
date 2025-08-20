import { createTransformer } from 'babel-jest';

import babelConfig from '../babel/babelConfig.js';
import targets from '../targets.json' with { type: 'json' };

import { getSkuContext } from '../../context/createSkuContext.js';

const { rootResolution } = await getSkuContext();

const transformer: ReturnType<typeof createTransformer> = createTransformer(
  babelConfig({
    target: 'jest',
    rootResolution,
    browserslist: targets.browserslistNodeTarget,
  }),
);

export default transformer;
