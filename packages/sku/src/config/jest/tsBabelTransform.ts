import { createTransformer } from 'babel-jest';

import babelConfig from '../babel/babelConfig.js';
import targets from '../targets.json' with { type: 'json' };
import { getSkuContext } from '#src/context/createSkuContext.js';

const { rootResolution } = getSkuContext();

const transformer: ReturnType<typeof createTransformer> = createTransformer(
  babelConfig({
    target: 'jest',
    lang: 'ts',
    rootResolution,
    browserslist: targets.browserslistNodeTarget,
  }),
);

export default transformer;
