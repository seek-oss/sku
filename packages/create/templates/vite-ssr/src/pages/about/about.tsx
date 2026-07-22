import { Box, Heading, Text, Strong, Stack } from 'braid-design-system';
import { Link } from 'react-router';

export function Component() {
  return (
    <Box padding="xlarge">
      <Stack space="large">
        <Heading level="2">About</Heading>
        <Text>
          This is a lazy-loaded route in your SSR starter. Prefer idiomatic{' '}
          <Strong>lazy: () =&gt; import(&apos;./…&apos;)</Strong> so sku can
          auto-derive modulepreloads in production. Export a named{' '}
          <Strong>Component</Strong> (not <Strong>default</Strong>) from the
          page module.
        </Text>
        <Text>
          <Link to="/">Back home</Link>
        </Text>
      </Stack>
    </Box>
  );
}
