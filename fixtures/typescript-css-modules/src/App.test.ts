import lessStyles from './lessStyles.less';

declare const SETUP_TESTS_SCRIPT_RAN: boolean;

describe('App', () => {
  test('"setupTests" script', () => {
    expect(SETUP_TESTS_SCRIPT_RAN).toEqual(true);
  });

  test('Less Styles', () => {
    expect(lessStyles.root).toEqual('lessStyles__root');
    expect(lessStyles.nested).toEqual('lessStyles__nested');
  });
});
