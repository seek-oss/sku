import React, { Fragment } from 'react';
import {
  Box,
  Heading,
  Text,
  Strong,
  Card,
  TextLink,
  BulletList,
  Bullet,
  Stack,
} from 'braid-design-system';

export default () => (
  <Fragment>
    <Box background="brand" paddingY="xxlarge" paddingX="gutter">
      <Stack space="medium">
        <Heading level="1">Congratulations 🎉</Heading>
        <Text>
          <Strong>{'<%= appName %>'}</Strong> has been successfully initialised.
        </Text>
      </Stack>
    </Box>
    <Box paddingX={['xsmall', 'gutter']} style={{ marginTop: '-40px' }}>
      <Card>
        <Stack space="medium">
          <Stack space="large" dividers>
            <Heading level="2">🏃🏾‍♀️ Next steps</Heading>

            <Text>
              The project comes pre-configured with a lot of standardised
              tooling to make authoring web applications easier.
            </Text>
          </Stack>

          <Heading level="4">Platform</Heading>

          <Text>
            The sku platform provides a number of tools to make development more
            efficient, for example,
            <TextLink href="https://www.typescriptlang.org/">
              TypeScript
            </TextLink>
            , <TextLink href="https://jestjs.io/">Jest</TextLink>,{' '}
            <TextLink href="https://eslint.org/">ESLint</TextLink>,{' '}
            <TextLink href="https://storybook.js.org/">Storybook</TextLink>,{' '}
            <TextLink href="https://github.com/seek-oss/playroom">
              Playroom
            </TextLink>
            , and more.
          </Text>

          <Text>
            For more information see the sku{' '}
            <TextLink href="https://seek-oss.github.io/sku/#/">
              documentation
            </TextLink>
            .
          </Text>

          <Heading level="4">Components</Heading>

          <Text>
            The project comes with{' '}
            <TextLink href="https://seek-oss.github.io/braid-design-system/">
              Braid design system
            </TextLink>
            . For more information on the available components check out the{' '}
            <TextLink href="https://seek-oss.github.io/braid-design-system/components">
              documentation
            </TextLink>
            .
          </Text>
        </Stack>
      </Card>

      <Card>
        <Stack space="medium">
          <Stack space="large" dividers>
            <Heading level="2">💬 Support</Heading>

            <Text>
              Whether it&rsquo;s a problem or a feature request, please
              don&rsquo;t hesitate to contact us via slack.
            </Text>
          </Stack>

          <Heading level="4">Technical support</Heading>

          <Text>
            For technical queries about the platform or the design system:
          </Text>

          <Box paddingBottom="xsmall">
            <BulletList>
              <Bullet>
                <TextLink href="https://seekchat.slack.com/channels/sku-support">
                  #sku-support
                </TextLink>
              </Bullet>
              <Bullet>
                <TextLink href="https://seekchat.slack.com/channels/braid-support">
                  #braid-support
                </TextLink>
              </Bullet>
            </BulletList>
          </Box>

          <Heading level="4">Design support</Heading>

          <Text>
            To discuss new or existing design patterns, visit{' '}
            <TextLink href="https://seekchat.slack.com/channels/braid-design-support">
              #braid-design-support
            </TextLink>
            .
          </Text>
        </Stack>
      </Card>
    </Box>
  </Fragment>
);
