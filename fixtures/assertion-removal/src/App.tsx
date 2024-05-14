import assert from 'assert';
import invariant from 'tiny-invariant';

export default () => {
  assert(false, 'Should be true');
  invariant(false, 'Should be true');

  return <div>It rendered without throwing an assertion error</div>;
};
