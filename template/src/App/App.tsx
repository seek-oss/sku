import 'braid-design-system/reset';

import { BraidProvider } from 'braid-design-system';
import apac from 'braid-design-system/themes/apac'
import React from 'react';

import { NextSteps } from './NextSteps';

interface AppProps {
  environment: 'development' | 'production';
}

export default ({ environment }: AppProps) => (
  <BraidProvider theme={apac}>
    <NextSteps environment={environment}/>
  </BraidProvider>
);
