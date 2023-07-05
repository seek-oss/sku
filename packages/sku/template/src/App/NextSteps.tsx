import {
  Box,
  Heading,
  Text,
  Strong,
  ContentBlock,
  TextLink,
  Stack,
  List,
} from 'braid-design-system';

import * as styles from './NextSteps.css';

interface NextStepsProps {
  environment: 'development' | 'production';
}
export function NextSteps({ environment }: NextStepsProps) {
  return (
    <Box
      paddingY="xxlarge"
      paddingX={{ mobile: 'small', tablet: 'gutter' }}
      background="customDark"
      className={styles.background}
    >
      <ContentBlock width="large">
        <Stack space="xxlarge">
          <Stack space="xlarge">
            <Stack space="medium" align="center">
              <Heading level="1" component="span">
                🎉
              </Heading>
              <Heading level="1" weight="weak">
                Congratulations!
              </Heading>
            </Stack>
            <Stack space="medium" align="center">
              <Text size="large">
                <Strong>{'<%= appName %>'}</Strong> has been successfully
                initialised.
              </Text>
              <Text>Current environment: {environment}</Text>
            </Stack>
          </Stack>

          <Box
            background="surface"
            borderRadius="xlarge"
            boxShadow="large"
            padding={{ mobile: 'large', tablet: 'xlarge', desktop: 'xxlarge' }}
          >
            <Stack
              space={{ mobile: 'xlarge', desktop: 'xxlarge' }}
              dividers="strong"
            >
              <Stack space="large">
                <Heading level="2">🏃🏾‍♀️ Next steps</Heading>
                <Text>
                  The project comes pre-configured with a lot of standardised
                  tooling to make authoring web applications easier.
                </Text>

                <Stack space="gutter">
                  <Heading level="3">Platform</Heading>

                  <Text>
                    The{' '}
                    <TextLink href="https://seek-oss.github.io/sku/#/">
                      sku platform
                    </TextLink>{' '}
                    provides a number of tools to make development more
                    efficient, for example,{' '}
                    <TextLink href="https://www.typescriptlang.org/">
                      TypeScript
                    </TextLink>
                    , <TextLink href="https://jestjs.io/">Jest</TextLink>,{' '}
                    <TextLink href="https://eslint.org/">ESLint</TextLink>,{' '}
                    <TextLink href="https://storybook.js.org/">
                      Storybook
                    </TextLink>{' '}
                    , and more.
                  </Text>
                </Stack>

                <Stack space="gutter">
                  <Heading level="3">Components</Heading>

                  <Text>
                    The project comes with{' '}
                    <TextLink href="https://seek-oss.github.io/braid-design-system/">
                      Braid Design System
                    </TextLink>{' '}
                    — SEEK&rsquo;s themeable component library.
                  </Text>
                </Stack>

                <Stack space="gutter">
                  <Heading level="3">Translations</Heading>

                  <Text>
                    The project comes with{' '}
                    <TextLink href="https://github.com/seek-oss/vocab/">
                      Vocab
                    </TextLink>{' '}
                    — SEEK&rsquo;s strongly-typed internationalization framework
                    for React.
                  </Text>
                </Stack>
              </Stack>

              <Stack space="large">
                <Heading level="2">🙋‍♂️ Support</Heading>

                <Text>
                  Whether it&rsquo;s a problem or a feature request, please
                  don&rsquo;t hesitate to contact us via slack.
                </Text>

                <Stack space="gutter">
                  <Heading level="3">Technical support</Heading>

                  <Text>
                    For technical queries about the platform or the design
                    system:
                  </Text>

                  <List>
                    <Text>
                      <TextLink href="https://seekchat.slack.com/channels/sku-support">
                        #sku-support
                      </TextLink>
                    </Text>
                    <Text>
                      <TextLink href="https://seekchat.slack.com/channels/braid-support">
                        #braid-support
                      </TextLink>
                    </Text>
                  </List>
                </Stack>

                <Stack space="gutter">
                  <Heading level="3">Design support</Heading>

                  <Text>
                    To discuss new or existing design patterns, visit{' '}
                    <TextLink href="https://seekchat.slack.com/channels/braid-design-support">
                      #braid-design-support
                    </TextLink>
                    .
                  </Text>
                </Stack>
              </Stack>

              <Stack space="large">
                <Heading level="2">📣 Announcements</Heading>

                <Text>
                  For keeping up to date with new features and bug fixes as they
                  are released, it&rsquo;s recommended to join and turn on
                  notifications for the following channels:
                </Text>

                <List>
                  <Text>
                    <TextLink href="https://seekchat.slack.com/channels/front-end-tooling-announcements">
                      #front-end-tooling-announcements
                    </TextLink>
                  </Text>
                  <Text>
                    <TextLink href="https://seekchat.slack.com/channels/braid-announcements">
                      #braid-announcements
                    </TextLink>
                  </Text>
                </List>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </ContentBlock>
    </Box>
  );
}
