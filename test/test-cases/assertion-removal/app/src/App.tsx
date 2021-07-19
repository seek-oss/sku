import assert from 'assert';

export default () => {
  assert(false, 'Should be true');

  return <div>It rendered without throwing an assertion error</div>;
};
