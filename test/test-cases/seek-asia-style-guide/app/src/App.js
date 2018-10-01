import React from 'react';
import {
  StyleGuideProvider,
  PageBlock,
  Section,
  Text
} from 'seek-asia-style-guide/react';

export default () => (
  <StyleGuideProvider>
    <PageBlock>
      <Section>
        <Text>Hello world!</Text>
      </Section>
    </PageBlock>
  </StyleGuideProvider>
);
