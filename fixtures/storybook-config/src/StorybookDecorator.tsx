import 'braid-design-system/reset';
import { BraidProvider } from 'braid-design-system';
import apac from 'braid-design-system/themes/apac';
import React from 'react';
// @ts-expect-error
import { StyleGuideProvider } from 'seek-style-guide/react';

export const StorybookDecorator = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <BraidProvider theme={apac}>
    <StyleGuideProvider>{children}</StyleGuideProvider>
  </BraidProvider>
);
