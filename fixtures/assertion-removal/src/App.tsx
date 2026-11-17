import assert from 'assert';
import invariant from 'tiny-invariant';
import { BraidProvider, Text } from 'braid-design-system';
import theme from 'braid-design-system/themes/seekJobs';

export default () => {
  assert(false, 'Should be true');
  invariant(false, 'Should be true');

  return (
    <BraidProvider theme={theme}>
      {/* Nesting `Text` inside `Text` triggers an assertion in braid */}
      <Text>
        <Text>It rendered without throwing an assertion error</Text>
      </Text>
    </BraidProvider>
  );
};
