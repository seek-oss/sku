import lessStyles from './styles.less';

describe('App', () => {
  test('LESS styles', () => {
    expect(lessStyles.root).toEqual('styles__root');
    expect(lessStyles.nested).toEqual('styles__nested');
  });
});
