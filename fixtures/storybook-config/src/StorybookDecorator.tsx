import 'braid-design-system/reset';
import { BraidProvider } from 'braid-design-system';
import apac from 'braid-design-system/themes/apac';

import React from 'react';

export const StorybookDecorator = ({
  children,
}: {
  children: React.ReactNode;
}) => <BraidProvider theme={apac}>{children}</BraidProvider>;
