import {
  StyleGuideProvider,
  PageBlock,
  Text,
  HeartIcon,
} from 'seek-style-guide/react';

export default () => (
  <StyleGuideProvider>
    <PageBlock>
      <Text>
        <span data-automation-svg>
          <HeartIcon />
        </span>
        <span data-automation-text>Hello world!</span>
      </Text>
    </PageBlock>
  </StyleGuideProvider>
);
