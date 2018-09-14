import lessStyles from './lessStyles.less';
import jsStyles from './jsStyles.css.js';

describe('react-css-modules styles', () => {
  test('Less Styles', () => {
    expect(lessStyles.root).toEqual('lessStyles__root');
    expect(lessStyles.nested).toEqual('lessStyles__nested');
  });

  test('JS Styles', () => {
    expect(jsStyles.root).toEqual('jsStyles__root');
    expect(jsStyles.nested).toEqual('jsStyles__nested');
  });
});
