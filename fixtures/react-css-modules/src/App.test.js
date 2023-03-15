import lessStyles from './lessStyles.less';

describe('react-css-modules styles', () => {
  test('"setupTests" script', () => {
    expect(global.SETUP_TESTS_SCRIPT_RAN).toEqual(true);
  });

  test('Less Styles', () => {
    expect(lessStyles.root).toEqual('lessStyles__root');
    expect(lessStyles.nested).toEqual('lessStyles__nested');
  });
});
