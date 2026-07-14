import { Box, Heading, Text, Strong, Stack } from 'braid-design-system';
import { Link } from 'react-router';

export default function About() {
  return (
    <Box padding="xlarge">
      <Stack space="large">
        <Heading level="2">About</Heading>
        <Text>
          This is a lazy-loaded route in your Vite SSR starter. Prefer idiomatic{' '}
          <Strong>lazy: () =&gt; import(&apos;./…&apos;)</Strong> so sku can
          auto-derive modulepreloads in production.
        </Text>
        <Text>
          <Link to="/">Back home</Link>
        </Text>
      </Stack>
    </Box>
  );
}
