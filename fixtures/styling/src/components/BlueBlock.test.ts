import BlueBlock from './BlueBlock';

import * as styles from './BlueBlock.css';

test('Vanilla Extract styles', () => {
  expect(styles.root).toEqual(expect.stringContaining('BlueBlock_root'));
  expect(styles.border).toEqual(expect.stringContaining('BlueBlock_border'));
});

test('external CSS loaded without errors', () => {
  expect(BlueBlock).toBeDefined();
});
