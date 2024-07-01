import * as styles from './styles.css.ts';

declare const SETUP_TESTS_SCRIPT_RAN: boolean;

describe('App', () => {
  test('"setupTests" script', () => {
    expect(SETUP_TESTS_SCRIPT_RAN).toEqual(true);
  });

  test('Vanilla Extract styles', () => {
    expect(styles.root).toEqual(expect.stringContaining('styles_root'));
    expect(styles.nested).toEqual(expect.stringContaining('styles_nested'));
  });
});
