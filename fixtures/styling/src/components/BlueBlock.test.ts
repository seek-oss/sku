import BlueBlock from './BlueBlock';
import lessStyles from './styles.less';
import * as styles from './BlueBlock.css';

test('LESS styles', () => {
  expect(lessStyles.root).toEqual('styles__root');
  expect(lessStyles.nested).toEqual('styles__nested');
});

test('Vanilla Extract styles', () => {
  expect(styles.root).toEqual(expect.stringContaining('BlueBlock_root'));
  expect(styles.border).toEqual(expect.stringContaining('BlueBlock_border'));
});

test('external CSS loaded without errors', () => {
  expect(BlueBlock).toBeDefined();
});
