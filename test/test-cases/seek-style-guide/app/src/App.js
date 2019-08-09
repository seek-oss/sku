import React from 'react';
import {
  StyleGuideProvider,
  PageBlock,
  Section,
  Text,
  HeartIcon,
} from 'seek-style-guide/react';

export default () => (
  <StyleGuideProvider>
    <PageBlock>
      <Section>
        <Text>
          <span data-automation-svg>
            <HeartIcon />
          </span>
          <span data-automation-text>Hello world!</span>
        </Text>
      </Section>
    </PageBlock>
  </StyleGuideProvider>
);
